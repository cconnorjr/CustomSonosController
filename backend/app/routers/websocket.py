import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.speaker_service import speaker_service
from app.ws.manager import manager

logger = logging.getLogger(__name__)
router = APIRouter(tags=["websocket"])


@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        states = await speaker_service.get_all_states()
        await ws.send_json({
            "type": "FULL_STATE",
            "speakers": [s.model_dump() for s in states],
        })
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        await manager.disconnect(ws)
