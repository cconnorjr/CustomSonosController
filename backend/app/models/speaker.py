from enum import Enum
from pydantic import BaseModel


class PlaybackState(str, Enum):
    PLAYING = "PLAYING"
    PAUSED = "PAUSED"
    STOPPED = "STOPPED"
    TRANSITIONING = "TRANSITIONING"
    UNKNOWN = "UNKNOWN"

    @classmethod
    def from_soco(cls, value: str) -> "PlaybackState":
        mapping = {
            "PLAYING": cls.PLAYING,
            "PAUSED_PLAYBACK": cls.PAUSED,
            "STOPPED": cls.STOPPED,
            "TRANSITIONING": cls.TRANSITIONING,
        }
        return mapping.get(value, cls.UNKNOWN)


class TrackInfo(BaseModel):
    title: str
    artist: str
    album: str
    album_art_uri: str
    position: str
    duration: str
    uri: str


class SpeakerState(BaseModel):
    uid: str
    name: str
    ip_address: str
    is_coordinator: bool
    group_uid: str | None
    group_members: list[str]
    playback_state: PlaybackState
    volume: int
    is_muted: bool
    now_playing: TrackInfo | None
    is_online: bool
