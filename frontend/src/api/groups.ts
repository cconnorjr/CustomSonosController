import { apiClient } from './client'

export const createGroup = (coordinator_uid: string, member_uids: string[]) =>
  apiClient.post('/groups', { coordinator_uid, member_uids })

export const ungroupSpeaker = (uid: string) => apiClient.delete(`/groups/${uid}`)
