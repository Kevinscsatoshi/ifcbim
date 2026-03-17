"""
HTTP routes for the CAD2BIM application.
"""

import logging

from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse

from app.services.conversion import ConversionError, ConversionService

logger = logging.getLogger(__name__)

router = APIRouter()
service = ConversionService()


@router.get("/api/capabilities")
async def capabilities():
    return service.capabilities()


@router.post("/api/convert")
async def convert(file: UploadFile = File(...)):
    try:
        return await service.convert_upload(file)
    except ConversionError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - defensive error boundary
        logger.exception("Unexpected conversion failure")
        raise HTTPException(status_code=500, detail="An unexpected error occurred during conversion.") from exc


@router.get("/api/jobs/{job_id}")
async def get_job(job_id: str):
    try:
        return service.get_job(job_id)
    except ConversionError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/api/jobs/{job_id}/viewer")
async def get_viewer(job_id: str):
    try:
        return service.get_viewer_data(job_id)
    except ConversionError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/download/{job_id}/{artifact}")
async def download(
    job_id: str,
    artifact: str,
    filename: str | None = Query(None, description="Suggested download filename"),
):
    try:
        path = service.get_artifact_path(job_id, artifact)
    except ConversionError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    media_type = {
        "ifc": "application/octet-stream",
        "dxf": "application/dxf",
    }.get(artifact, "application/octet-stream")
    return FileResponse(
        path,
        media_type=media_type,
        filename=filename or path.name,
    )
