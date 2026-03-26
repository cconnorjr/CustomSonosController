import { apiClient } from './client'

export const setVolume = (uid: string, level: number, muted?: boolean) =>
  apiClient.put(`/speakers/${uid}/volume`, { level, muted })
