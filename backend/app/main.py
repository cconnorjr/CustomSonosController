import asyncio
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.routers import groups, playback, queue, speakers, volume, websocket
from app.services.poller import poll_loop
from app.services.speaker_service import speaker_service

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up — discovering Sonos speakers...")
    await speaker_service.discover()
    poller_task = asyncio.create_task(poll_loop())
    yield
    logger.info("Shutting down...")
    poller_task.cancel()
    try:
        await poller_task
    except asyncio.CancelledError:
        pass


app = FastAPI(title="Sonos Controller", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(speakers.router, prefix="/api")
app.include_router(playback.router, prefix="/api")
app.include_router(volume.router, prefix="/api")
app.include_router(queue.router, prefix="/api")
app.include_router(groups.router, prefix="/api")
app.include_router(websocket.router)


@app.get("/health", include_in_schema=False)
async def health():
    return JSONResponse({"status": "ok"})


# Serve the built React frontend when STATIC_DIR is set (production / Electron)
_static_dir = os.environ.get("STATIC_DIR")
if _static_dir and Path(_static_dir).is_dir():
    app.mount("/", StaticFiles(directory=_static_dir, html=True), name="static")
    logger.info("Serving static frontend from %s", _static_dir)
