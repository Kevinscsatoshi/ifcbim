"""
Layer-to-IFC Class Mapping Engine
Maps CAD layer names to IFC element types with configurable rules.
"""

import re
import json
import logging
from dataclasses import dataclass, field
from typing import Optional

logger = logging.getLogger(__name__)


@dataclass
class IFCClassMapping:
    ifc_class: str
    default_height: float = 3000.0
    default_thickness: float = 200.0
    material: str = "Concrete"
    property_set: dict = field(default_factory=dict)
    description: str = ""


DEFAULT_MAPPINGS = {
    r"(?i)(ext.*wall|外墙|facade)": IFCClassMapping(
        ifc_class="IfcWall", default_height=3000.0, default_thickness=300.0,
        material="Concrete", description="External wall",
        property_set={"IsExternal": True, "IsLoadBearing": True},
    ),
    r"(?i)(wall|wand|mur|pared|墙)": IFCClassMapping(
        ifc_class="IfcWall", default_height=3000.0, default_thickness=200.0,
        material="Concrete", description="Wall",
        property_set={"IsExternal": False, "IsLoadBearing": False},
    ),
    r"(?i)(door|tür|porte|puerta|门)": IFCClassMapping(
        ifc_class="IfcDoor", default_height=2100.0, default_thickness=100.0,
        material="Wood", description="Door",
        property_set={"IsExternal": False, "FireRating": ""},
    ),
    r"(?i)(window|fenster|fenêtre|ventana|窗)": IFCClassMapping(
        ifc_class="IfcWindow", default_height=1200.0, default_thickness=100.0,
        material="Glass", description="Window",
        property_set={"IsExternal": True},
    ),
    r"(?i)(column|col|stütze|pilier|柱)": IFCClassMapping(
        ifc_class="IfcColumn", default_height=3000.0, default_thickness=400.0,
        material="Concrete", description="Column",
        property_set={"IsLoadBearing": True},
    ),
    r"(?i)(beam|träger|poutre|梁)": IFCClassMapping(
        ifc_class="IfcBeam", default_height=600.0, default_thickness=300.0,
        material="Concrete", description="Beam",
        property_set={"IsLoadBearing": True},
    ),
    r"(?i)(slab|floor|decke|plancher|板|楼板)": IFCClassMapping(
        ifc_class="IfcSlab", default_height=200.0, default_thickness=200.0,
        material="Concrete", description="Slab",
        property_set={"IsLoadBearing": True},
    ),
    r"(?i)(stair|treppe|escalier|escalera|楼梯)": IFCClassMapping(
        ifc_class="IfcStair", default_height=3000.0, default_thickness=300.0,
        material="Concrete", description="Stair",
    ),
    r"(?i)(roof|dach|toit|屋顶)": IFCClassMapping(
        ifc_class="IfcRoof", default_height=300.0, default_thickness=300.0,
        material="Concrete", description="Roof",
    ),
    r"(?i)(furn|möbel|meuble|furniture|家具)": IFCClassMapping(
        ifc_class="IfcFurnishingElement", default_height=900.0, default_thickness=0.0,
        material="Wood", description="Furniture",
    ),
    r"(?i)(room|space|raum|espace|房间|空间)": IFCClassMapping(
        ifc_class="IfcSpace", default_height=3000.0, default_thickness=0.0,
        material="", description="Space/Room",
    ),
    r"(?i)(hvac|mech|duct|通风|管道)": IFCClassMapping(
        ifc_class="IfcDistributionElement", default_height=300.0, default_thickness=300.0,
        material="Steel", description="HVAC/Mechanical",
    ),
    r"(?i)(plumb|pipe|sanitär|plomberie|管|给排水)": IFCClassMapping(
        ifc_class="IfcPipeSegment", default_height=100.0, default_thickness=50.0,
        material="PVC", description="Plumbing",
    ),
    r"(?i)(elec|elektr|électr|电气)": IFCClassMapping(
        ifc_class="IfcDistributionElement", default_height=0.0, default_thickness=0.0,
        material="Copper", description="Electrical",
    ),
}


class LayerMapper:
    def __init__(self, custom_mappings: Optional[dict] = None):
        self.mappings = dict(DEFAULT_MAPPINGS)
        if custom_mappings:
            self.mappings.update(custom_mappings)
        self._cache = {}

    def get_mapping(self, layer_name: str) -> IFCClassMapping:
        if layer_name in self._cache:
            return self._cache[layer_name]
        for pattern, mapping in self.mappings.items():
            if re.search(pattern, layer_name):
                self._cache[layer_name] = mapping
                return mapping
        default = IFCClassMapping(
            ifc_class="IfcBuildingElementProxy",
            default_height=100.0, default_thickness=0.0,
            material="", description=f"Unmapped layer: {layer_name}",
        )
        self._cache[layer_name] = default
        return default

    def get_all_mappings_for_layers(self, layer_names: list) -> dict:
        result = {}
        for name in layer_names:
            m = self.get_mapping(name)
            result[name] = {
                "ifc_class": m.ifc_class,
                "height": m.default_height,
                "thickness": m.default_thickness,
                "material": m.material,
                "description": m.description,
            }
        return result

    def add_mapping(self, pattern: str, mapping: IFCClassMapping):
        self.mappings[pattern] = mapping
        self._cache.clear()

    def export_config(self, filepath: str):
        export = {}
        for pattern, mapping in self.mappings.items():
            export[pattern] = {
                "ifc_class": mapping.ifc_class,
                "default_height": mapping.default_height,
                "default_thickness": mapping.default_thickness,
                "material": mapping.material,
                "description": mapping.description,
                "property_set": mapping.property_set,
            }
        with open(filepath, "w") as f:
            json.dump(export, f, indent=2)

    @classmethod
    def from_config(cls, filepath: str) -> "LayerMapper":
        with open(filepath, "r") as f:
            data = json.load(f)
        custom = {pattern: IFCClassMapping(**cfg) for pattern, cfg in data.items()}
        return cls(custom_mappings=custom)
