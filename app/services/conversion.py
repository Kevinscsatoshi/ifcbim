"""
Conversion orchestration for uploaded CAD files.
"""

from __future__ import annotations

import json
import logging
import os
import shutil
import tempfile
import uuid
from pathlib import Path

import aiofiles
from fastapi import UploadFile

from app.services.dwg_converter import DwgConversionError, DwgConverter
from app.services.ifc_builder import DRAWING_UNIT_TO_METERS, IfcBuilder
from modules.dxf_parser import ParsedCadFile, Point2D, DxfParser
from modules.layer_mapper import LayerMapper

logger = logging.getLogger(__name__)

ALLOWED_SUFFIXES = {".dxf", ".dwg"}
DEFAULT_MAX_UPLOAD_MB = 100
VERCEL_MAX_UPLOAD_MB = 4


class ConversionError(RuntimeError):
    """Raised when input validation or conversion fails."""


class ConversionService:
    def __init__(self, base_dir: Path | None = None):
        project_root = Path(__file__).resolve().parents[2]
        self.running_on_vercel = bool(os.getenv("VERCEL"))
        default_base_dir = project_root / "data" / "jobs"
        if self.running_on_vercel:
            default_base_dir = Path(tempfile.gettempdir()) / "ifcbim-jobs"
        configured_base_dir = os.getenv("CAD2BIM_JOB_DIR")
        if base_dir is not None:
            self.base_dir = base_dir
        elif configured_base_dir:
            self.base_dir = Path(configured_base_dir)
        else:
            self.base_dir = default_base_dir
        self.base_dir.mkdir(parents=True, exist_ok=True)
        self.parser = DxfParser()
        self.mapper = LayerMapper()
        self.ifc_builder = IfcBuilder(self.mapper)
        self.dwg_converter = DwgConverter()
        self.max_upload_mb = VERCEL_MAX_UPLOAD_MB if self.running_on_vercel else DEFAULT_MAX_UPLOAD_MB
        self.max_upload_bytes = self.max_upload_mb * 1024 * 1024

    def capabilities(self) -> dict:
        return {
            "supported_uploads": sorted(ALLOWED_SUFFIXES),
            "dwg_enabled": self.dwg_converter.is_available(),
            "dwg_message": self.dwg_converter.availability_message(),
            "max_upload_mb": self.max_upload_mb,
            "runtime": "vercel" if self.running_on_vercel else "local",
            "oda_download_url": "https://www.opendesign.com/guestfiles/oda_file_converter",
        }

    async def convert_upload(self, upload: UploadFile) -> dict:
        suffix = Path(upload.filename or "").suffix.lower()
        if suffix not in ALLOWED_SUFFIXES:
            raise ConversionError("Only .dwg and .dxf uploads are supported.")

        job_id = self._new_job_id()
        job_dir = self.base_dir / job_id
        job_dir.mkdir(parents=True, exist_ok=True)

        source_path = job_dir / f"source{suffix}"
        total_bytes = 0
        try:
            async with aiofiles.open(source_path, "wb") as output_file:
                while True:
                    chunk = await upload.read(1024 * 1024)
                    if not chunk:
                        break
                    total_bytes += len(chunk)
                    if total_bytes > self.max_upload_bytes:
                        raise ConversionError(f"Upload exceeded the {self.max_upload_mb}MB file limit.")
                    await output_file.write(chunk)
        finally:
            await upload.close()

        return self._convert(job_id=job_id, original_filename=upload.filename or source_path.name)

    def convert_path(self, source_path: Path) -> dict:
        if not source_path.exists():
            raise ConversionError(f"Input file was not found: {source_path}")
        suffix = source_path.suffix.lower()
        if suffix not in ALLOWED_SUFFIXES:
            raise ConversionError("Only .dwg and .dxf files are supported.")

        job_id = self._new_job_id()
        job_dir = self.base_dir / job_id
        job_dir.mkdir(parents=True, exist_ok=True)

        stored_source = job_dir / f"source{suffix}"
        shutil.copy2(source_path, stored_source)
        return self._convert(job_id=job_id, original_filename=source_path.name)

    def get_job(self, job_id: str) -> dict:
        metadata_path = self.base_dir / job_id / "metadata.json"
        if not metadata_path.exists():
            raise ConversionError("Job does not exist or its outputs were already cleaned up.")
        return json.loads(metadata_path.read_text(encoding="utf-8"))

    def get_artifact_path(self, job_id: str, artifact: str) -> Path:
        artifact_map = {
            "ifc": "model.ifc",
            "dxf": "source.dxf",
        }
        if artifact not in artifact_map:
            raise ConversionError("Unknown artifact type.")
        artifact_path = self.base_dir / job_id / artifact_map[artifact]
        if not artifact_path.exists():
            raise ConversionError("Requested artifact does not exist.")
        return artifact_path

    def get_viewer_data(self, job_id: str) -> dict:
        viewer_path = self.base_dir / job_id / "viewer.json"
        if not viewer_path.exists():
            raise ConversionError("Viewer data does not exist for this job.")
        return json.loads(viewer_path.read_text(encoding="utf-8"))

    def _convert(self, job_id: str, original_filename: str) -> dict:
        job_dir = self.base_dir / job_id
        source_path = next(job_dir.glob("source.*"), None)
        if not source_path:
            raise ConversionError("Uploaded source file is missing.")

        normalized_source = source_path
        warnings: list[str] = []
        if self.running_on_vercel:
            warnings.append(
                "This Vercel deployment uses temporary function storage. Generate and inspect the 3D viewer immediately after upload."
            )
        if source_path.suffix.lower() == ".dwg":
            normalized_source = job_dir / "source.dxf"
            try:
                normalized_source = self.dwg_converter.convert_to_dxf(source_path, normalized_source)
            except DwgConversionError as exc:
                raise ConversionError(str(exc)) from exc
            warnings.append("DWG was normalized into DXF before the IFC pipeline ran.")

        try:
            parsed = self.parser.parse(str(normalized_source))
        except ValueError as exc:
            raise ConversionError(f"DXF 解析失败：{exc}") from exc
        except Exception as exc:
            raise ConversionError(f"解析失败：{exc}") from exc

        ifc_output = job_dir / "model.ifc"
        viewer_output = job_dir / "viewer.json"

        try:
            build_result = self.ifc_builder.build(parsed, ifc_output)
        except ValueError as exc:
            raise ConversionError(f"IFC 构建失败：{exc}") from exc
        except Exception as exc:
            raise ConversionError(f"IFC 构建失败：{exc}") from exc
        if build_result.skipped_entities:
            warnings.append(f"{build_result.skipped_entities} CAD entities were skipped because their geometry was incomplete.")
        viewer_output.write_text(json.dumps(build_result.viewer_scene, ensure_ascii=False, indent=2), encoding="utf-8")

        response = self._build_response(
            job_id=job_id,
            original_filename=original_filename,
            source_path=source_path,
            normalized_source=normalized_source,
            parsed=parsed,
            build_result=build_result,
            warnings=warnings,
        )

        metadata = json.loads(json.dumps(response, ensure_ascii=False))
        metadata_path = job_dir / "metadata.json"
        metadata_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
        return metadata

    def _build_response(
        self,
        job_id: str,
        original_filename: str,
        source_path: Path,
        normalized_source: Path,
        parsed: ParsedCadFile,
        build_result,
        warnings: list[str],
    ) -> dict:
        parsed_summary = parsed.summary()
        layer_mapping = self.mapper.get_all_mappings_for_layers(sorted(parsed.layers.keys()))
        unit_factor = DRAWING_UNIT_TO_METERS.get(parsed.units, 0.001)

        payload = {
            "job_id": job_id,
            "status": "completed",
            "original_filename": original_filename,
            "input_format": source_path.suffix.lower().lstrip("."),
            "normalized_source": normalized_source.name,
            "warnings": warnings,
            "capabilities": self.capabilities(),
            "summary": {
                **parsed_summary,
                "bounding_box": self._bounding_box_to_dict(parsed.bounding_box, unit_factor),
                "mappings": layer_mapping,
            },
            "viewer": {
                "data_url": f"/api/jobs/{job_id}/viewer",
                "element_count": build_result.viewer_scene["element_count"],
                "bounds": build_result.viewer_scene["bounds"],
                "scene": build_result.viewer_scene,
            },
            "ifc": {
                "element_count": build_result.element_count,
                "class_counts": build_result.class_counts,
                "skipped_entities": build_result.skipped_entities,
                "elements": build_result.elements,
            },
            "artifacts": {
                "ifc": self._artifact_dict(job_id, "ifc", build_result.output_path),
            },
        }

        if normalized_source.suffix.lower() == ".dxf":
            payload["artifacts"]["dxf"] = self._artifact_dict(job_id, "dxf", normalized_source)
        if not self.running_on_vercel:
            payload["entities"] = [self._serialize_entity(entity, unit_factor) for entity in parsed.entities]
        return payload

    def _artifact_dict(self, job_id: str, artifact: str, path: Path, exists: bool = True) -> dict:
        size_bytes = path.stat().st_size if exists and path.exists() else 0
        return {
            "filename": path.name,
            "download_url": f"/download/{job_id}/{artifact}",
            "size_bytes": size_bytes,
        }

    def _serialize_entity(self, entity, unit_factor: float) -> dict:
        bbox = self._bounding_box_to_dict(entity.bounding_box, unit_factor)
        mapping = self.mapper.get_mapping(entity.layer)
        return {
            "entity_type": entity.entity_type,
            "layer": entity.layer,
            "mapped_ifc_class": mapping.ifc_class,
            "material": mapping.material,
            "length_meters": round(entity.length * unit_factor, 4),
            "bounding_box": bbox,
            "is_closed": entity.is_closed,
            "text_content": entity.text_content,
            "block_name": entity.block_name,
        }

    def _bounding_box_to_dict(
        self,
        bounding_box: tuple[Point2D, Point2D] | None,
        unit_factor: float,
    ) -> dict | None:
        if not bounding_box:
            return None
        minimum, maximum = bounding_box
        return {
            "min": {"x": round(minimum.x * unit_factor, 4), "y": round(minimum.y * unit_factor, 4)},
            "max": {"x": round(maximum.x * unit_factor, 4), "y": round(maximum.y * unit_factor, 4)},
            "unit": "m",
        }

    def _new_job_id(self) -> str:
        return uuid.uuid4().hex[:12]
