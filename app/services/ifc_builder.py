"""
IFC authoring pipeline for parsed CAD entities.
"""

from __future__ import annotations

import logging
import math
from collections import Counter
from dataclasses import dataclass
from pathlib import Path

import ifcopenshell
import ifcopenshell.api.aggregate
import ifcopenshell.api.context
import ifcopenshell.api.geometry
import ifcopenshell.api.material
import ifcopenshell.api.project
import ifcopenshell.api.pset
import ifcopenshell.api.root
import ifcopenshell.api.spatial
import ifcopenshell.api.unit

from modules.dxf_parser import CadEntity, ParsedCadFile, Point2D
from modules.layer_mapper import IFCClassMapping, LayerMapper

logger = logging.getLogger(__name__)

DRAWING_UNIT_TO_METERS = {
    "unitless": 0.001,
    "mm": 0.001,
    "cm": 0.01,
    "m": 1.0,
    "km": 1000.0,
    "inches": 0.0254,
    "feet": 0.3048,
    "miles": 1609.344,
}

MAPPING_DEFAULT_MM_TO_METERS = 0.001
ABSTRACT_CLASS_FALLBACKS = {
    "IfcDistributionElement": "IfcFlowSegment",
}
FOOTPRINT_CLASSES = {"IfcSlab", "IfcRoof", "IfcSpace"}
VIEWER_COLORS = {
    "IfcWall": "#ca6632",
    "IfcDoor": "#784f3f",
    "IfcWindow": "#71b6d6",
    "IfcColumn": "#9a4f1d",
    "IfcBeam": "#a8632e",
    "IfcSlab": "#d39f68",
    "IfcRoof": "#a74435",
    "IfcStair": "#875b46",
    "IfcSpace": "#7cc4b3",
    "IfcFlowSegment": "#7a8cb6",
    "IfcPipeSegment": "#5f7ac5",
    "IfcBuildingElementProxy": "#8d8378",
}


@dataclass
class MeshItem:
    vertices: list[tuple[float, float, float]]
    faces: list[list[int]]


@dataclass
class IfcBuildResult:
    output_path: Path
    class_counts: dict[str, int]
    element_count: int
    skipped_entities: int
    elements: list[dict]
    viewer_scene: dict


class IfcBuilder:
    def __init__(self, mapper: LayerMapper | None = None):
        self.mapper = mapper or LayerMapper()

    def build(self, parsed: ParsedCadFile, output_path: Path) -> IfcBuildResult:
        unit_factor = DRAWING_UNIT_TO_METERS.get(parsed.units, 0.001)
        model = ifcopenshell.api.project.create_file(version="IFC4")
        project = ifcopenshell.api.root.create_entity(model, ifc_class="IfcProject", name="CAD2BIM Project")
        ifcopenshell.api.unit.assign_unit(
            model,
            length={"is_metric": True, "raw": "METERS"},
            area={"is_metric": True, "raw": "METERS"},
            volume={"is_metric": True, "raw": "METERS"},
        )
        model_3d = ifcopenshell.api.context.add_context(model, context_type="Model")
        body = ifcopenshell.api.context.add_context(
            model,
            context_type="Model",
            context_identifier="Body",
            target_view="MODEL_VIEW",
            parent=model_3d,
        )

        site = ifcopenshell.api.root.create_entity(model, ifc_class="IfcSite", name="Default Site")
        building = ifcopenshell.api.root.create_entity(model, ifc_class="IfcBuilding", name="Generated Building")
        storey = ifcopenshell.api.root.create_entity(model, ifc_class="IfcBuildingStorey", name="Level 01")

        ifcopenshell.api.aggregate.assign_object(model, products=[site], relating_object=project)
        ifcopenshell.api.aggregate.assign_object(model, products=[building], relating_object=site)
        ifcopenshell.api.aggregate.assign_object(model, products=[storey], relating_object=building)

        material_cache: dict[str, ifcopenshell.entity_instance] = {}
        class_counts: Counter[str] = Counter()
        exported_elements: list[dict] = []
        viewer_elements: list[dict] = []
        scene_vertices: list[tuple[float, float, float]] = []
        skipped_entities = 0

        for index, entity in enumerate(parsed.entities, start=1):
            mapping = self.mapper.get_mapping(entity.layer)
            ifc_class = self._resolve_ifc_class(mapping.ifc_class)
            meshes, geometry_strategy = self._entity_to_mesh_items(entity, mapping, unit_factor)
            if not meshes:
                skipped_entities += 1
                continue

            product = ifcopenshell.api.root.create_entity(
                model,
                ifc_class=ifc_class,
                name=f"{ifc_class}_{index:04d}",
            )
            if hasattr(product, "Description"):
                product.Description = mapping.description or None

            if ifc_class == "IfcSpace":
                ifcopenshell.api.aggregate.assign_object(model, products=[product], relating_object=storey)
            else:
                ifcopenshell.api.spatial.assign_container(model, products=[product], relating_structure=storey)

            representation = ifcopenshell.api.geometry.add_mesh_representation(
                model,
                context=body,
                vertices=[mesh.vertices for mesh in meshes],
                faces=[mesh.faces for mesh in meshes],
            )
            ifcopenshell.api.geometry.assign_representation(model, product=product, representation=representation)
            ifcopenshell.api.geometry.edit_object_placement(model, product=product)

            material_name = mapping.material or "Generic"
            if ifc_class != "IfcSpace":
                material = self._get_material(model, material_cache, material_name)
                ifcopenshell.api.material.assign_material(model, products=[product], material=material)

            self._attach_metadata(model, product, entity, mapping, geometry_strategy, unit_factor)
            class_counts[ifc_class] += 1
            exported_elements.append(
                {
                    "name": product.Name,
                    "ifc_class": ifc_class,
                    "layer": entity.layer,
                    "entity_type": entity.entity_type,
                    "geometry_strategy": geometry_strategy,
                    "material": material_name,
                }
            )
            viewer_elements.append(
                {
                    "name": product.Name,
                    "ifc_class": ifc_class,
                    "layer": entity.layer,
                    "material": material_name,
                    "color": self._viewer_color(ifc_class),
                    "mesh_items": [self._serialize_mesh(mesh) for mesh in meshes],
                }
            )
            for mesh in meshes:
                scene_vertices.extend(mesh.vertices)

        output_path.parent.mkdir(parents=True, exist_ok=True)
        model.write(str(output_path))
        logger.info("IFC written to %s with %s elements", output_path, sum(class_counts.values()))
        viewer_scene = {
            "unit": "m",
            "element_count": len(viewer_elements),
            "bounds": self._scene_bounds(scene_vertices),
            "elements": viewer_elements,
        }
        return IfcBuildResult(
            output_path=output_path,
            class_counts=dict(sorted(class_counts.items())),
            element_count=sum(class_counts.values()),
            skipped_entities=skipped_entities,
            elements=exported_elements,
            viewer_scene=viewer_scene,
        )

    def _attach_metadata(
        self,
        model: ifcopenshell.file,
        product: ifcopenshell.entity_instance,
        entity: CadEntity,
        mapping: IFCClassMapping,
        geometry_strategy: str,
        unit_factor: float,
    ) -> None:
        pset = ifcopenshell.api.pset.add_pset(model, product=product, name="CAD2BIM_Metadata")
        properties = {
            "SourceLayer": entity.layer,
            "SourceEntity": entity.entity_type,
            "GeometryStrategy": geometry_strategy,
            "MappedClass": self._resolve_ifc_class(mapping.ifc_class),
            "MaterialGuess": mapping.material,
            "EntityLengthMeters": round(entity.length * unit_factor, 4),
            "DefaultHeightMeters": round(mapping.default_height * MAPPING_DEFAULT_MM_TO_METERS, 4),
            "DefaultThicknessMeters": round(mapping.default_thickness * MAPPING_DEFAULT_MM_TO_METERS, 4),
        }
        if entity.text_content:
            properties["SourceText"] = entity.text_content[:255]
        if mapping.property_set:
            properties["LayerRules"] = ", ".join(
                f"{key}={value}" for key, value in sorted(mapping.property_set.items())
            )
        ifcopenshell.api.pset.edit_pset(model, pset=pset, properties=properties)

    def _get_material(
        self,
        model: ifcopenshell.file,
        cache: dict[str, ifcopenshell.entity_instance],
        material_name: str,
    ) -> ifcopenshell.entity_instance:
        if material_name not in cache:
            cache[material_name] = ifcopenshell.api.material.add_material(
                model,
                name=material_name,
                category=self._material_category(material_name),
            )
        return cache[material_name]

    def _material_category(self, material_name: str) -> str:
        lowered = material_name.lower()
        for category in (
            "concrete",
            "steel",
            "aluminium",
            "brick",
            "stone",
            "wood",
            "glass",
            "plastic",
        ):
            if category in lowered:
                return category
        return "generic"

    def _resolve_ifc_class(self, ifc_class: str) -> str:
        return ABSTRACT_CLASS_FALLBACKS.get(ifc_class, ifc_class or "IfcBuildingElementProxy")

    def _viewer_color(self, ifc_class: str) -> str:
        return VIEWER_COLORS.get(ifc_class, "#8d8378")

    def _entity_to_mesh_items(
        self,
        entity: CadEntity,
        mapping: IFCClassMapping,
        unit_factor: float,
    ) -> tuple[list[MeshItem], str]:
        height = max(mapping.default_height * MAPPING_DEFAULT_MM_TO_METERS, 0.1)
        thickness = max(mapping.default_thickness * MAPPING_DEFAULT_MM_TO_METERS, 0.08)

        if entity.entity_type == "line" and len(entity.points) >= 2:
            return [self._segment_prism(entity.points[0], entity.points[1], thickness, height, unit_factor)], "segment-prism"

        if entity.entity_type == "polyline" and len(entity.points) >= 2:
            points = self._normalize_points(entity.points, unit_factor, entity.is_closed)
            if len(points) >= 3 and (entity.is_closed or self._has_polygon_area(points)) and self._resolve_ifc_class(mapping.ifc_class) in FOOTPRINT_CLASSES.union({"IfcWall", "IfcColumn"}):
                return [self._polygon_prism(points, height)], "footprint-prism"
            meshes: list[MeshItem] = []
            for start, end in zip(entity.points, entity.points[1:]):
                if self._distance(start, end) * unit_factor < 1e-5:
                    continue
                meshes.append(self._segment_prism(start, end, thickness, height, unit_factor))
            return meshes, "polyline-segments"

        if entity.entity_type == "circle" and entity.center:
            radius = max(entity.radius * unit_factor, thickness * 0.5)
            return [self._cylinder_prism(entity.center, radius, height, unit_factor)], "cylinder-prism"

        if entity.entity_type == "arc" and entity.center and entity.radius > 0:
            points = self._sample_arc(entity, unit_factor)
            if len(points) < 2:
                return [], "unsupported"
            meshes = [
                self._segment_prism(Point2D(a[0] / unit_factor, a[1] / unit_factor), Point2D(b[0] / unit_factor, b[1] / unit_factor), thickness, height, unit_factor)
                for a, b in zip(points, points[1:])
            ]
            return meshes, "arc-segments"

        if entity.entity_type in {"block_ref", "text"}:
            point = entity.points[0] if entity.points else Point2D(0.0, 0.0)
            footprint = max(thickness, 0.25)
            return [self._box_at_point(point, footprint, footprint, height, unit_factor)], "marker-box"

        return [], "unsupported"

    def _segment_prism(
        self,
        start: Point2D,
        end: Point2D,
        thickness: float,
        height: float,
        unit_factor: float,
    ) -> MeshItem:
        sx = start.x * unit_factor
        sy = start.y * unit_factor
        ex = end.x * unit_factor
        ey = end.y * unit_factor
        dx = ex - sx
        dy = ey - sy
        length = math.hypot(dx, dy)
        if length < 1e-6:
            return self._box_at_point(start, thickness, thickness, height, unit_factor)
        offset_x = -(dy / length) * (thickness / 2.0)
        offset_y = (dx / length) * (thickness / 2.0)
        footprint = [
            (sx + offset_x, sy + offset_y),
            (ex + offset_x, ey + offset_y),
            (ex - offset_x, ey - offset_y),
            (sx - offset_x, sy - offset_y),
        ]
        return self._extrude_footprint(footprint, height)

    def _box_at_point(
        self,
        point: Point2D,
        width: float,
        depth: float,
        height: float,
        unit_factor: float,
    ) -> MeshItem:
        cx = point.x * unit_factor
        cy = point.y * unit_factor
        footprint = [
            (cx - width / 2.0, cy - depth / 2.0),
            (cx + width / 2.0, cy - depth / 2.0),
            (cx + width / 2.0, cy + depth / 2.0),
            (cx - width / 2.0, cy + depth / 2.0),
        ]
        return self._extrude_footprint(footprint, height)

    def _polygon_prism(self, points: list[tuple[float, float]], height: float) -> MeshItem:
        return self._extrude_footprint(points, height)

    def _cylinder_prism(
        self,
        center: Point2D,
        radius: float,
        height: float,
        unit_factor: float,
        segments: int = 24,
    ) -> MeshItem:
        cx = center.x * unit_factor
        cy = center.y * unit_factor
        footprint = []
        for index in range(segments):
            angle = (2.0 * math.pi * index) / segments
            footprint.append((cx + math.cos(angle) * radius, cy + math.sin(angle) * radius))
        return self._extrude_footprint(footprint, height)

    def _sample_arc(self, entity: CadEntity, unit_factor: float) -> list[tuple[float, float]]:
        span = entity.end_angle - entity.start_angle
        if span <= 0:
            span += 360.0
        segments = max(6, int(span / 12.0))
        points = []
        for index in range(segments + 1):
            angle = math.radians(entity.start_angle + (span * index / segments))
            points.append(
                (
                    (entity.center.x + math.cos(angle) * entity.radius) * unit_factor,
                    (entity.center.y + math.sin(angle) * entity.radius) * unit_factor,
                )
            )
        return points

    def _extrude_footprint(self, footprint: list[tuple[float, float]], height: float) -> MeshItem:
        if len(footprint) < 3:
            raise ValueError("Footprint needs at least three points.")
        bottom = [(x, y, 0.0) for x, y in footprint]
        top = [(x, y, height) for x, y in footprint]
        vertices = bottom + top
        count = len(footprint)
        faces: list[list[int]] = [
            list(range(count - 1, -1, -1)),
            list(range(count, count * 2)),
        ]
        for index in range(count):
            next_index = (index + 1) % count
            faces.append([index, next_index, count + next_index, count + index])
        return MeshItem(vertices=vertices, faces=faces)

    def _normalize_points(
        self,
        points: list[Point2D],
        unit_factor: float,
        is_closed: bool,
    ) -> list[tuple[float, float]]:
        normalized = [(point.x * unit_factor, point.y * unit_factor) for point in points]
        if is_closed and normalized and normalized[0] == normalized[-1]:
            normalized = normalized[:-1]
        return normalized

    def _has_polygon_area(self, points: list[tuple[float, float]]) -> bool:
        return abs(self._polygon_area(points)) > 1e-6

    def _polygon_area(self, points: list[tuple[float, float]]) -> float:
        area = 0.0
        for index in range(len(points)):
            x1, y1 = points[index]
            x2, y2 = points[(index + 1) % len(points)]
            area += (x1 * y2) - (x2 * y1)
        return area / 2.0

    def _distance(self, start: Point2D, end: Point2D) -> float:
        return math.hypot(end.x - start.x, end.y - start.y)

    def _serialize_mesh(self, mesh: MeshItem) -> dict:
        return {
            "vertices": [[round(x, 4), round(y, 4), round(z, 4)] for x, y, z in mesh.vertices],
            "faces": [list(face) for face in mesh.faces],
        }

    def _scene_bounds(self, vertices: list[tuple[float, float, float]]) -> dict | None:
        if not vertices:
            return None
        xs = [vertex[0] for vertex in vertices]
        ys = [vertex[1] for vertex in vertices]
        zs = [vertex[2] for vertex in vertices]
        return {
            "min": {"x": round(min(xs), 4), "y": round(min(ys), 4), "z": round(min(zs), 4)},
            "max": {"x": round(max(xs), 4), "y": round(max(ys), 4), "z": round(max(zs), 4)},
            "unit": "m",
        }
