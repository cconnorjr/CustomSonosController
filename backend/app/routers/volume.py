import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.speaker_service import speaker_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/speakers/{uid}", tags=["volume"])


class VolumeRequest(BaseModel):
    level: int = Field(ge=0, le=100)
    muted: bool | None = None


@router.get("/volume")
async def get_volume(uid: str):
    try:
        return {"uid": uid, **(await speaker_service.get_volume(uid))}
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Speaker communication error: {exc}")


@router.put("/volume", status_code=204)
async def set_volume(uid: str, body: VolumeRequest):
    try:
        await speaker_service.set_volume(uid, body.level, body.muted)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Speaker communication error: {exc}")
