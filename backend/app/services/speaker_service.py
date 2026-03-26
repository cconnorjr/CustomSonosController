import asyncio
import logging
import threading
from concurrent.futures import ThreadPoolExecutor
from typing import Any

import soco
import soco.exceptions

from app.config import settings
from app.models.group import GroupState
from app.models.queue import QueueItem, QueueResponse
from app.models.speaker import PlaybackState, SpeakerState, TrackInfo

logger = logging.getLogger(__name__)


class SpeakerService:
    def __init__(self) -> None:
        self._executor = ThreadPoolExecutor(max_workers=settings.max_workers)
        self._lock = threading.Lock()
        self._devices: dict[str, soco.SoCo] = {}

    # --- Internal helpers ---

    async def _run(self, fn, *args) -> Any:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(self._executor, fn, *args)

    def _get_device(self, uid: str) -> soco.SoCo:
        with self._lock:
            device = self._devices.get(uid)
        if device is None:
            raise KeyError(f"Speaker '{uid}' not found. Try re-running discovery.")
        return device

    @staticmethod
    def _make_art_uri(ip: str, uri: str) -> str:
        if uri and uri.startswith("/"):
            return f"http://{ip}:1400{uri}"
        return uri

    # --- Discovery ---

    def _discover_sync(self) -> list[str]:
        found = soco.discover(timeout=settings.discovery_timeout) or set()
        with self._lock:
            # Merge: update existing entries, add new ones, keep stale ones
            # (poller will mark stale speakers offline)
            for d in found:
                self._devices[d.uid] = d
        if not found:
            logger.warning("SoCo discovery found no devices on the network.")
        else:
            logger.info("Discovered %d speaker(s): %s", len(found), [d.player_name for d in found])
        return [d.uid for d in found]

    async def discover(self) -> list[str]:
        return await self._run(self._discover_sync)

    # --- State snapshot ---

    def _get_state_sync(self, uid: str) -> SpeakerState | None:
        with self._lock:
            device = self._devices.get(uid)
        if device is None:
            return None
        try:
            transport_info = device.get_current_transport_info()
            track_info = device.get_current_track_info()
            group = device.group

            raw_art = track_info.get("album_art_uri", "")
            art_uri = self._make_art_uri(device.ip_address, raw_art)

            return SpeakerState(
                uid=uid,
                name=device.player_name,
                ip_address=device.ip_address,
                is_coordinator=device.is_coordinator,
                group_uid=group.uid if group else None,
                group_members=[m.uid for m in group.members] if group else [],
                playback_state=PlaybackState.from_soco(
                    transport_info.get("current_transport_state", "")
                ),
                volume=device.volume,
                is_muted=device.mute,
                now_playing=TrackInfo(
                    title=track_info.get("title", ""),
                    artist=track_info.get("artist", ""),
                    album=track_info.get("album", ""),
                    album_art_uri=art_uri,
                    position=track_info.get("position", ""),
                    duration=track_info.get("duration", ""),
                    uri=track_info.get("uri", ""),
                ),
                is_online=True,
            )
        except Exception as exc:
            logger.debug("Failed to get state for speaker %s: %s", uid, exc)
            return SpeakerState(
                uid=uid,
                name=device.player_name if device else "",
                ip_address=device.ip_address if device else "",
                is_coordinator=False,
                group_uid=None,
                group_members=[],
                playback_state=PlaybackState.UNKNOWN,
                volume=0,
                is_muted=False,
                now_playing=None,
                is_online=False,
            )

    async def get_all_states(self) -> list[SpeakerState]:
        with self._lock:
            uids = list(self._devices.keys())
        loop = asyncio.get_running_loop()
        tasks = [loop.run_in_executor(self._executor, self._get_state_sync, uid) for uid in uids]
        results = await asyncio.gather(*tasks)
        return [r for r in results if r is not None]

    async def get_state(self, uid: str) -> SpeakerState:
        """Get state for a single speaker by UID."""
        self._get_device(uid)  # raises KeyError if unknown
        state = await self._run(self._get_state_sync, uid)
        if state is None:
            raise KeyError(f"Speaker '{uid}' not found.")
        return state

    # --- Playback controls ---

    async def play(self, uid: str) -> None:
        device = self._get_device(uid)
        await self._run(device.play)

    async def pause(self, uid: str) -> None:
        device = self._get_device(uid)
        await self._run(device.pause)

    async def stop(self, uid: str) -> None:
        device = self._get_device(uid)
        await self._run(device.stop)

    async def next_track(self, uid: str) -> None:
        device = self._get_device(uid)
        await self._run(device.next)

    async def previous_track(self, uid: str) -> None:
        device = self._get_device(uid)
        await self._run(device.previous)

    # --- Volume ---

    async def get_volume(self, uid: str) -> dict:
        device = self._get_device(uid)

        def _get():
            return {"level": device.volume, "is_muted": device.mute}

        return await self._run(_get)

    async def set_volume(self, uid: str, level: int, muted: bool | None = None) -> None:
        device = self._get_device(uid)
        clamped = max(0, min(100, level))

        def _set():
            device.volume = clamped
            if muted is not None:
                device.mute = muted

        await self._run(_set)

    # --- Queue ---

    def _get_queue_sync(self, uid: str) -> QueueResponse:
        device = self._get_device(uid)
        items = device.get_queue()
        return QueueResponse(
            uid=uid,
            total=len(items),
            items=[
                QueueItem(
                    position=i,
                    title=getattr(item, "title", ""),
                    artist=getattr(item, "creator", ""),
                    album=getattr(item, "album", ""),
                    duration=getattr(item, "duration", ""),
                    uri=getattr(item, "uri", ""),
                )
                for i, item in enumerate(items)
            ],
        )

    async def get_queue(self, uid: str) -> QueueResponse:
        return await self._run(self._get_queue_sync, uid)

    async def add_to_queue(self, uid: str, uri: str, position: int | None = None) -> None:
        device = self._get_device(uid)

        def _add():
            if position is not None:
                device.add_uri_to_queue(uri, position)
            else:
                device.add_uri_to_queue(uri)

        await self._run(_add)

    async def clear_queue(self, uid: str) -> None:
        device = self._get_device(uid)
        await self._run(device.clear_queue)

    # --- Grouping ---

    def _get_all_groups_sync(self) -> list[GroupState]:
        with self._lock:
            devices = list(self._devices.values())
        seen: dict[str, GroupState] = {}
        for device in devices:
            try:
                group = device.group
                if group and group.uid not in seen:
                    coordinator = group.coordinator
                    seen[group.uid] = GroupState(
                        group_uid=group.uid,
                        coordinator_uid=coordinator.uid,
                        coordinator_name=coordinator.player_name,
                        member_uids=[m.uid for m in group.members],
                        member_names=[m.player_name for m in group.members],
                    )
            except Exception as exc:
                logger.debug("Failed to get group info for %s: %s", device.player_name, exc)
        return list(seen.values())

    async def get_groups(self) -> list[GroupState]:
        return await self._run(self._get_all_groups_sync)

    async def create_group(self, coordinator_uid: str, member_uids: list[str]) -> None:
        coordinator = self._get_device(coordinator_uid)
        members = [self._get_device(uid) for uid in member_uids]

        def _join():
            for m in members:
                m.join(coordinator)

        await self._run(_join)

    async def ungroup(self, uid: str) -> None:
        device = self._get_device(uid)
        await self._run(device.unjoin)


speaker_service = SpeakerService()
