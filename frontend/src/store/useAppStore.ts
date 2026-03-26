import { create } from 'zustand'
import type { GroupState, SpeakerState, WsStatus } from './types'

interface AppState {
  speakers: Record<string, SpeakerState>
  groups: GroupState[]
  wsStatus: WsStatus
  selectedUid: string | null

  upsertSpeakers: (updates: SpeakerState[]) => void
  setGroups: (groups: GroupState[]) => void
  setWsStatus: (status: WsStatus) => void
  setSelectedUid: (uid: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  speakers: {},
  groups: [],
  wsStatus: 'connecting',
  selectedUid: null,

  upsertSpeakers: (updates) =>
    set((state) => ({
      speakers: {
        ...state.speakers,
        ...Object.fromEntries(updates.map((s) => [s.uid, s])),
      },
    })),

  setGroups: (groups) => set({ groups }),
  setWsStatus: (wsStatus) => set({ wsStatus }),
  setSelectedUid: (selectedUid) => set({ selectedUid }),
}))
