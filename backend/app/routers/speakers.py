import logging

from fastapi import APIRouter, HTTPException

from app.models.speaker import SpeakerState
from app.services.speaker_service import speaker_service

logger = logging.getLogger(__name__)
router = APIRouter(tags=["speakers"])


@router.get("/speakers", response_model=list[SpeakerState])
async def list_speakers():
    return await speaker_service.get_all_states()


@router.post("/speakers/discover", response_model=list[str])
async def refresh_discovery():
    return await speaker_service.discover()


@router.get("/speakers/{uid}", response_model=SpeakerState)
async def get_speaker(uid: str):
    try:
        return await speaker_service.get_state(uid)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Speaker '{uid}' not found")


@router.get("/speakers/{uid}/now-playing")
async def now_playing(uid: str):
    try:
        state = await speaker_service.get_state(uid)
        return state.now_playing
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Speaker '{uid}' not found")
