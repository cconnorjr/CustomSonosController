import logging

from fastapi import APIRouter, HTTPException

from app.models.group import GroupCreateRequest, GroupState
from app.services.speaker_service import speaker_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/groups", tags=["groups"])


@router.get("", response_model=list[GroupState])
async def list_groups():
    try:
        return await speaker_service.get_groups()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Speaker communication error: {exc}")


@router.post("", status_code=204)
async def create_group(body: GroupCreateRequest):
    try:
        await speaker_service.create_group(body.coordinator_uid, body.member_uids)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Speaker communication error: {exc}")


@router.delete("/{uid}", status_code=204)
async def ungroup_speaker(uid: str):
    try:
        await speaker_service.ungroup(uid)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Speaker communication error: {exc}")
