import logging
from typing import NoReturn

from fastapi import APIRouter, HTTPException

from app.services.speaker_service import speaker_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/speakers/{uid}", tags=["playback"])


def _handle_error(exc: Exception) -> NoReturn:
    if isinstance(exc, KeyError):
        raise HTTPException(status_code=404, detail=str(exc))
    raise HTTPException(status_code=502, detail=f"Speaker communication error: {exc}")


@router.post("/play", status_code=204)
async def play(uid: str):
    try:
        await speaker_service.play(uid)
    except Exception as exc:
        _handle_error(exc)


@router.post("/pause", status_code=204)
async def pause(uid: str):
    try:
        await speaker_service.pause(uid)
    except Exception as exc:
        _handle_error(exc)


@router.post("/stop", status_code=204)
async def stop(uid: str):
    try:
        await speaker_service.stop(uid)
    except Exception as exc:
        _handle_error(exc)


@router.post("/next", status_code=204)
async def next_track(uid: str):
    try:
        await speaker_service.next_track(uid)
    except Exception as exc:
        _handle_error(exc)


@router.post("/previous", status_code=204)
async def previous_track(uid: str):
    try:
        await speaker_service.previous_track(uid)
    except Exception as exc:
        _handle_error(exc)
