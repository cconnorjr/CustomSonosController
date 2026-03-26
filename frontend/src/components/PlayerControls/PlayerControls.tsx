import { useCallback } from 'react'
import * as playbackApi from '../../api/playback'
import { useAppStore } from '../../store/useAppStore'
import styles from './PlayerControls.module.css'

interface Props {
  uid: string
}

export function PlayerControls({ uid }: Props) {
  const speaker = useAppStore((s) => s.speakers[uid])
  const upsertSpeakers = useAppStore((s) => s.upsertSpeakers)

  const action = useCallback(
    (fn: () => Promise<unknown>, optimisticState?: Partial<typeof speaker>) => {
      if (!speaker) return
      if (optimisticState) upsertSpeakers([{ ...speaker, ...optimisticState }])
      fn().catch(() => {
        if (optimisticState) upsertSpeakers([speaker])
      })
    },
    [speaker, upsertSpeakers],
  )

  if (!speaker) return null

  const isPlaying = speaker.playback_state === 'PLAYING'
  const track = speaker.now_playing

  return (
    <div className={styles.container}>
      {track && (
        <div className={styles.trackInfo}>
          {track.album_art_uri && (
            <img
              src={track.album_art_uri}
              alt="Album art"
              className={styles.albumArt}
            />
          )}
          <div className={styles.trackText}>
            <span className={styles.trackTitle}>{track.title || 'Unknown title'}</span>
            <span className={styles.trackArtist}>{track.artist}</span>
          </div>
        </div>
      )}
      <div className={styles.buttons}>
        <button
          onClick={() => action(() => playbackApi.previous(uid))}
          disabled={!speaker.is_online}
          aria-label="Previous"
        >
          ⏮
        </button>
        <button
          onClick={() =>
            action(
              () => isPlaying ? playbackApi.pause(uid) : playbackApi.play(uid),
              { playback_state: isPlaying ? 'PAUSED' : 'PLAYING' },
            )
          }
          disabled={!speaker.is_online}
          className={styles.playPause}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button
          onClick={() => action(() => playbackApi.stop(uid), { playback_state: 'STOPPED' })}
          disabled={!speaker.is_online}
          aria-label="Stop"
        >
          ⏹
        </button>
        <button
          onClick={() => action(() => playbackApi.next(uid))}
          disabled={!speaker.is_online}
          aria-label="Next"
        >
          ⏭
        </button>
      </div>
    </div>
  )
}
