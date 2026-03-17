"""
End-to-end pipeline test for DXF to IFC conversion with viewer data generation.
"""

import json
import sys
import tempfile
import unittest
from pathlib import Path

import ezdxf
import ifcopenshell

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.services.conversion import ConversionService


class PipelineTest(unittest.TestCase):
    def test_generates_ifc_and_viewer_outputs(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            source = temp_path / "sample.dxf"
            self._create_sample_dxf(source)

            service = ConversionService(base_dir=temp_path / "jobs")
            result = service.convert_path(source)

            ifc_path = service.get_artifact_path(result["job_id"], "ifc")
            viewer_data = service.get_viewer_data(result["job_id"])

            self.assertTrue(ifc_path.exists())
            self.assertGreater(result["ifc"]["element_count"], 0)
            self.assertIn("IfcWall", result["ifc"]["class_counts"])
            self.assertIn("viewer", result)
            self.assertGreater(viewer_data["element_count"], 0)

            model = ifcopenshell.open(str(ifc_path))
            self.assertEqual(len(model.by_type("IfcProject")), 1)
            self.assertGreaterEqual(len(model.by_type("IfcWall")), 1)

            payload = json.loads((temp_path / "jobs" / result["job_id"] / "metadata.json").read_text(encoding="utf-8"))
            self.assertEqual(payload["status"], "completed")
            self.assertEqual(payload["summary"]["units"], "mm")

    def _create_sample_dxf(self, path: Path) -> None:
        doc = ezdxf.new("R2018")
        doc.header["$INSUNITS"] = 4
        for layer_name in ("A-WALL", "A-SLAB", "A-COLUMN", "A-DOOR"):
            if layer_name not in doc.layers:
                doc.layers.add(layer_name)

        modelspace = doc.modelspace()
        modelspace.add_line((0, 0), (5000, 0), dxfattribs={"layer": "A-WALL"})
        modelspace.add_lwpolyline(
            [(0, 0), (5000, 0), (5000, 4000), (0, 4000)],
            dxfattribs={"layer": "A-SLAB"},
            close=True,
        )
        modelspace.add_circle((2500, 2000), 250, dxfattribs={"layer": "A-COLUMN"})
        modelspace.add_text("Lobby", dxfattribs={"layer": "A-DOOR", "height": 250}).set_placement((1000, 800))
        doc.saveas(path)


if __name__ == "__main__":
    unittest.main()
