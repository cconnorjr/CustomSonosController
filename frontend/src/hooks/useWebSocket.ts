import { useEffect, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'
import type { GroupState, SpeakerState } from '../store/types'

const WS_URL = import.meta.env.VITE_WS_URL ?? `ws://${window.location.host}/ws`
const RECONNECT_DELAY_MS = 3000

export function useWebSocket() {
  const { upsertSpeakers, setGroups, setWsStatus } = useAppStore()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function connect() {
      setWsStatus('connecting')
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => setWsStatus('connected')

      ws.onmessage = (event: MessageEvent) => {
        let msg: unknown
        try {
          msg = JSON.parse(event.data as string)
        } catch {
          return
        }

        if (typeof msg !== 'object' || msg === null || !('type' in msg)) return

        const { type } = msg as { type: string }

        if (
          (type === 'FULL_STATE' || type === 'STATE_UPDATE') &&
          'speakers' in (msg as object) &&
          Array.isArray((msg as { speakers: unknown }).speakers)
        ) {
          upsertSpeakers((msg as { speakers: SpeakerState[] }).speakers)
        }

        if (
          type === 'GROUP_UPDATE' &&
          'groups' in (msg as object) &&
          Array.isArray((msg as { groups: unknown }).groups)
        ) {
          setGroups((msg as { groups: GroupState[] }).groups)
        }
      }

      ws.onerror = () => setWsStatus('error')

      ws.onclose = () => {
        setWsStatus('disconnected')
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS)
      }
    }

    connect()

    return () => {
      wsRef.current?.close()
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
