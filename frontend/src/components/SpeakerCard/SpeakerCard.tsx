import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { PlayerControls } from '../PlayerControls/PlayerControls'
import { QueuePanel } from '../QueuePanel/QueuePanel'
import { VolumeSlider } from '../VolumeSlider/VolumeSlider'
import styles from './SpeakerCard.module.css'

interface Props {
  uid: string
}

export function SpeakerCard({ uid }: Props) {
  const speaker = useAppStore((s) => s.speakers[uid])
  const [showQueue, setShowQueue] = useState(false)

  if (!speaker) return null

  const memberCount = speaker.group_members.length

  return (
    <div className={`${styles.card} ${!speaker.is_online ? styles.offline : ''}`}>
      <div className={styles.header}>
        <div className={styles.meta}>
          <span className={styles.name}>{speaker.name}</span>
          {memberCount > 1 && (
            <span className={styles.groupBadge}>
              Group · {memberCount} speakers
            </span>
          )}
        </div>
        <span className={`${styles.statusDot} ${speaker.is_online ? styles.online : styles.offlineDot}`} />
      </div>

      <PlayerControls uid={uid} />
      <VolumeSlider uid={uid} />

      <button
        className={styles.queueToggle}
        onClick={() => setShowQueue((v) => !v)}
      >
        {showQueue ? 'Hide Queue' : 'Show Queue'}
      </button>

      {showQueue && <QueuePanel uid={uid} />}
    </div>
  )
}
