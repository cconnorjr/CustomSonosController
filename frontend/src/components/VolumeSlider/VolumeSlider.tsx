import { useCallback, useEffect, useRef, useState } from 'react'
import { setVolume } from '../../api/volume'
import { useAppStore } from '../../store/useAppStore'
import styles from './VolumeSlider.module.css'

interface Props {
  uid: string
}

const DRAG_SAFETY_TIMEOUT_MS = 2000

export function VolumeSlider({ uid }: Props) {
  const speaker = useAppStore((s) => s.speakers[uid])
  const upsertSpeakers = useAppStore((s) => s.upsertSpeakers)
  const [localVolume, setLocalVolume] = useState(speaker?.volume ?? 50)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isDragging = useRef(false)

  useEffect(() => {
    if (speaker && !isDragging.current) setLocalVolume(speaker.volume)
  }, [speaker?.volume])

  const clearDragging = useCallback(() => {
    isDragging.current = false
    if (safetyTimer.current) {
      clearTimeout(safetyTimer.current)
      safetyTimer.current = null
    }
  }, [])

  const handlePointerDown = useCallback(() => {
    isDragging.current = true
    // Safety: force-clear dragging if pointerup is somehow missed
    if (safetyTimer.current) clearTimeout(safetyTimer.current)
    safetyTimer.current = setTimeout(clearDragging, DRAG_SAFETY_TIMEOUT_MS)
  }, [clearDragging])

  const handlePointerUp = useCallback(() => {
    clearDragging()
  }, [clearDragging])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const level = Number(e.target.value)
      setLocalVolume(level)

      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      debounceTimer.current = setTimeout(() => {
        setVolume(uid, level).catch(() => {
          if (speaker) setLocalVolume(speaker.volume)
        })
      }, 150)
    },
    [uid, speaker],
  )

  const handleMuteToggle = useCallback(() => {
    if (!speaker) return
    const next = !speaker.is_muted
    upsertSpeakers([{ ...speaker, is_muted: next }])
    setVolume(uid, speaker.volume, next).catch(() => {
      upsertSpeakers([{ ...speaker, is_muted: speaker.is_muted }])
    })
  }, [uid, speaker, upsertSpeakers])

  if (!speaker) return null

  return (
    <div className={styles.container}>
      <button
        className={styles.muteBtn}
        onClick={handleMuteToggle}
        title={speaker.is_muted ? 'Unmute' : 'Mute'}
        aria-label={speaker.is_muted ? 'Unmute' : 'Mute'}
      >
        {speaker.is_muted ? '🔇' : localVolume === 0 ? '🔈' : '🔊'}
      </button>
      <input
        type="range"
        min={0}
        max={100}
        value={localVolume}
        onChange={handleChange}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className={styles.slider}
        aria-label="Volume"
      />
      <span className={styles.label}>{localVolume}</span>
    </div>
  )
}
