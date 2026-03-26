from pydantic import BaseModel


class GroupState(BaseModel):
    group_uid: str
    coordinator_uid: str
    coordinator_name: str
    member_uids: list[str]
    member_names: list[str]


class GroupCreateRequest(BaseModel):
    coordinator_uid: str
    member_uids: list[str]
