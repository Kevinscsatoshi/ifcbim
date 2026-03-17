"""
DXF/DWG Parser Module
Extracts geometry, layers, blocks, and attributes from CAD files.
"""

import ezdxf
from ezdxf.entities import Line, LWPolyline, Polyline, Circle, Arc, Insert, Text, MText
from dataclasses import dataclass, field
from typing import Optional
import math
import logging

logger = logging.getLogger(__name__)


@dataclass
class Point2D:
    x: float
    y: float

    def to_tuple(self):
        return (self.x, self.y)


@dataclass
class CadEntity:
    """Represents a parsed CAD entity with geometry and metadata."""
    entity_type: str  # line, polyline, circle, arc, block_ref, text
    layer: str
    color: int = 0
    linetype: str = "CONTINUOUS"
    lineweight: float = 0.0
    points: list = field(default_factory=list)
    radius: float = 0.0
    start_angle: float = 0.0
    end_angle: float = 0.0
    center: Optional[Point2D] = None
    is_closed: bool = False
    block_name: str = ""
    text_content: str = ""
    rotation: float = 0.0
    scale: tuple = (1.0, 1.0, 1.0)
    attributes: dict = field(default_factory=dict)

    @property
    def bounding_box(self):
        if not self.points:
            if self.center:
                return (
                    Point2D(self.center.x - self.radius, self.center.y - self.radius),
                    Point2D(self.center.x + self.radius, self.center.y + self.radius),
                )
            return None
        xs = [p.x for p in self.points]
        ys = [p.y for p in self.points]
        return (Point2D(min(xs), min(ys)), Point2D(max(xs), max(ys)))

    @property
    def length(self):
        if self.entity_type == "circle":
            return 2 * math.pi * self.radius
        if self.entity_type == "arc":
            angle = abs(self.end_angle - self.start_angle)
            return self.radius * math.radians(angle)
        if len(self.points) < 2:
            return 0.0
        total = 0.0
        for i in range(len(self.points) - 1):
            dx = self.points[i + 1].x - self.points[i].x
            dy = self.points[i + 1].y - self.points[i].y
            total += math.sqrt(dx * dx + dy * dy)
        if self.is_closed and len(self.points) > 2:
            dx = self.points[0].x - self.points[-1].x
            dy = self.points[0].y - self.points[-1].y
            total += math.sqrt(dx * dx + dy * dy)
        return total


@dataclass
class CadLayer:
    name: str
    color: int = 7
    linetype: str = "CONTINUOUS"
    is_off: bool = False
    is_frozen: bool = False
    entity_count: int = 0


@dataclass
class ParsedCadFile:
    filename: str
    units: str = "mm"
    layers: dict = field(default_factory=dict)
    entities: list = field(default_factory=list)
    block_definitions: dict = field(default_factory=dict)

    @property
    def entities_by_layer(self):
        result = {}
        for entity in self.entities:
            if entity.layer not in result:
                result[entity.layer] = []
            result[entity.layer].append(entity)
        return result

    @property
    def bounding_box(self):
        all_points = []
        for e in self.entities:
            bb = e.bounding_box
            if bb:
                all_points.extend([bb[0], bb[1]])
        if not all_points:
            return None
        xs = [p.x for p in all_points]
        ys = [p.y for p in all_points]
        return (Point2D(min(xs), min(ys)), Point2D(max(xs), max(ys)))

    def summary(self):
        return {
            "filename": self.filename,
            "units": self.units,
            "layer_count": len(self.layers),
            "entity_count": len(self.entities),
            "layers": {
                name: {
                    "color": layer.color,
                    "entity_count": layer.entity_count,
                }
                for name, layer in self.layers.items()
            },
        }


class DxfParser:
    """Parses DXF files and extracts structured geometry data."""

    UNIT_MAP = {
        0: "unitless", 1: "inches", 2: "feet",
        3: "miles", 4: "mm", 5: "cm", 6: "m", 7: "km",
    }

    def parse(self, filepath: str) -> ParsedCadFile:
        logger.info(f"Parsing DXF file: {filepath}")
        try:
            doc = ezdxf.readfile(filepath)
        except Exception as e:
            raise ValueError(f"Cannot read DXF file: {e}")

        parsed = ParsedCadFile(filename=filepath)
        units_code = doc.header.get("$INSUNITS", 0)
        parsed.units = self.UNIT_MAP.get(units_code, "mm")

        for layer in doc.layers:
            parsed.layers[layer.dxf.name] = CadLayer(
                name=layer.dxf.name,
                color=layer.dxf.color,
                linetype=layer.dxf.linetype if layer.dxf.hasattr("linetype") else "CONTINUOUS",
                is_off=not layer.is_on(),
                is_frozen=layer.is_frozen(),
            )

        for block in doc.blocks:
            if block.name.startswith("*"):
                continue
            block_entities = []
            for entity in block:
                parsed_entity = self._parse_entity(entity)
                if parsed_entity:
                    block_entities.append(parsed_entity)
            if block_entities:
                parsed.block_definitions[block.name] = block_entities

        msp = doc.modelspace()
        for entity in msp:
            parsed_entity = self._parse_entity(entity)
            if parsed_entity:
                parsed.entities.append(parsed_entity)
                layer_name = parsed_entity.layer
                if layer_name in parsed.layers:
                    parsed.layers[layer_name].entity_count += 1

        logger.info(f"Parsed {len(parsed.entities)} entities across {len(parsed.layers)} layers")
        return parsed

    def _parse_entity(self, entity) -> Optional[CadEntity]:
        try:
            layer = entity.dxf.layer if entity.dxf.hasattr("layer") else "0"
            color = entity.dxf.color if entity.dxf.hasattr("color") else 0

            if isinstance(entity, Line):
                return CadEntity(
                    entity_type="line", layer=layer, color=color,
                    points=[
                        Point2D(entity.dxf.start.x, entity.dxf.start.y),
                        Point2D(entity.dxf.end.x, entity.dxf.end.y),
                    ],
                )
            elif isinstance(entity, LWPolyline):
                points = [Point2D(p[0], p[1]) for p in entity.get_points(format="xy")]
                return CadEntity(
                    entity_type="polyline", layer=layer, color=color,
                    points=points, is_closed=entity.closed,
                )
            elif isinstance(entity, Polyline):
                points = [Point2D(v.dxf.location.x, v.dxf.location.y) for v in entity.vertices]
                return CadEntity(
                    entity_type="polyline", layer=layer, color=color,
                    points=points, is_closed=entity.is_closed,
                )
            elif isinstance(entity, Circle):
                return CadEntity(
                    entity_type="circle", layer=layer, color=color,
                    center=Point2D(entity.dxf.center.x, entity.dxf.center.y),
                    radius=entity.dxf.radius,
                )
            elif isinstance(entity, Arc):
                return CadEntity(
                    entity_type="arc", layer=layer, color=color,
                    center=Point2D(entity.dxf.center.x, entity.dxf.center.y),
                    radius=entity.dxf.radius,
                    start_angle=entity.dxf.start_angle,
                    end_angle=entity.dxf.end_angle,
                )
            elif isinstance(entity, Insert):
                return CadEntity(
                    entity_type="block_ref", layer=layer, color=color,
                    points=[Point2D(entity.dxf.insert.x, entity.dxf.insert.y)],
                    block_name=entity.dxf.name,
                    rotation=entity.dxf.rotation if entity.dxf.hasattr("rotation") else 0.0,
                    scale=(
                        entity.dxf.xscale if entity.dxf.hasattr("xscale") else 1.0,
                        entity.dxf.yscale if entity.dxf.hasattr("yscale") else 1.0,
                        entity.dxf.zscale if entity.dxf.hasattr("zscale") else 1.0,
                    ),
                    attributes={
                        attrib.dxf.tag: attrib.dxf.text
                        for attrib in entity.attribs
                    } if hasattr(entity, 'attribs') else {},
                )
            elif isinstance(entity, (Text, MText)):
                text_content = entity.dxf.text if isinstance(entity, Text) else entity.text
                insert_pt = entity.dxf.insert if entity.dxf.hasattr("insert") else None
                points = [Point2D(insert_pt.x, insert_pt.y)] if insert_pt else []
                return CadEntity(
                    entity_type="text", layer=layer, color=color,
                    points=points, text_content=text_content or "",
                )
            else:
                return None
        except Exception as e:
            logger.warning(f"Failed to parse entity: {e}")
            return None
