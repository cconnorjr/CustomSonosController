from pydantic import BaseModel


class QueueItem(BaseModel):
    position: int
    title: str
    artist: str
    album: str
    duration: str
    uri: str


class QueueResponse(BaseModel):
    uid: str
    items: list[QueueItem]
    total: int


class AddToQueueRequest(BaseModel):
    uri: str
    position: int | None = None
