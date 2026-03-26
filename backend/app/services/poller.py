import asyncio
import logging

from app.config import settings
from app.services.speaker_service import speaker_service
from app.ws.manager import manager

logger = logging.getLogger(__name__)

_previous_states: dict[str, dict] = {}
_previous_groups: list[dict] = []
_consecutive_failures: int = 0
_MAX_BACKOFF: float = 30.0


async def poll_loop() -> None:
    global _consecutive_failures

    while True:
        try:
            states = await speaker_service.get_all_states()
            current_uids = {state.uid for state in states}
            changed = []

            for state in states:
                state_dict = state.model_dump()
                if _previous_states.get(state.uid) != state_dict:
                    _previous_states[state.uid] = state_dict
                    changed.append(state_dict)

            # Prune speakers that are no longer reported by the service
            stale_uids = set(_previous_states.keys()) - current_uids
            for uid in stale_uids:
                stale = _previous_states.pop(uid)
                stale["is_online"] = False
                changed.append(stale)

            if changed:
                await manager.broadcast({"type": "STATE_UPDATE", "speakers": changed})

            # Poll group changes
            await _poll_groups()

            # Reset backoff on success
            _consecutive_failures = 0

        except Exception as exc:
            _consecutive_failures += 1
            backoff = min(
                settings.poll_interval_seconds * (2 ** _consecutive_failures),
                _MAX_BACKOFF,
            )
            logger.error(
                "Poller error (failure #%d, next retry in %.1fs): %s",
                _consecutive_failures, backoff, exc,
            )
            await asyncio.sleep(backoff)
            continue

        await asyncio.sleep(settings.poll_interval_seconds)


async def _poll_groups() -> None:
    global _previous_groups

    try:
        groups = await speaker_service.get_groups()
        groups_data = [g.model_dump() for g in groups]

        if groups_data != _previous_groups:
            _previous_groups = groups_data
            await manager.broadcast({"type": "GROUP_UPDATE", "groups": groups_data})
    except Exception as exc:
        logger.debug("Group poll error: %s", exc)
