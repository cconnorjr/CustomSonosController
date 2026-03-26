import logging

from fastapi import APIRouter, HTTPException

from app.models.queue import AddToQueueRequest, QueueResponse
from app.services.speaker_service import speaker_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/speakers/{uid}/queue", tags=["queue"])


@router.get("", response_model=QueueResponse)
async def get_queue(uid: str):
    try:
        return await speaker_service.get_queue(uid)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Speaker communication error: {exc}")


@router.post("", status_code=204)
async def add_to_queue(uid: str, body: AddToQueueRequest):
    try:
        await speaker_service.add_to_queue(uid, body.uri, body.position)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Speaker communication error: {exc}")


@router.delete("", status_code=204)
async def clear_queue(uid: str):
    try:
        await speaker_service.clear_queue(uid)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Speaker communication error: {exc}")
