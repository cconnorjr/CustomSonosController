import { apiClient } from './client'

export const play = (uid: string) => apiClient.post(`/speakers/${uid}/play`)
export const pause = (uid: string) => apiClient.post(`/speakers/${uid}/pause`)
export const stop = (uid: string) => apiClient.post(`/speakers/${uid}/stop`)
export const next = (uid: string) => apiClient.post(`/speakers/${uid}/next`)
export const previous = (uid: string) => apiClient.post(`/speakers/${uid}/previous`)
