import { useState } from 'react'
import { discoverSpeakers } from '../../api/speakers'
import { useAppStore } from '../../store/useAppStore'
import { SpeakerCard } from '../SpeakerCard/SpeakerCard'
import styles from './SpeakerList.module.css'

export function SpeakerList() {
  const speakers = useAppStore((s) => s.speakers)
  const wsStatus = useAppStore((s) => s.wsStatus)
  const uids = Object.keys(speakers)
  const [discovering, setDiscovering] = useState(false)

  const handleRediscover = async () => {
    setDiscovering(true)
    try {
      await discoverSpeakers()
    } finally {
      setDiscovering(false)
    }
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Speakers</h2>
        <span className={`${styles.wsBadge} ${styles[wsStatus]}`}>
          {wsStatus === 'connected' ? 'Live' : wsStatus}
        </span>
        <button
          className={styles.rediscoverBtn}
          onClick={handleRediscover}
          disabled={discovering}
        >
          {discovering ? 'Scanning…' : 'Rediscover'}
        </button>
      </div>

      {uids.length === 0 ? (
        <p className={styles.empty}>
          {wsStatus === 'connecting'
            ? 'Connecting…'
            : 'No speakers found. Make sure your Sonos devices are on the same network.'}
        </p>
      ) : (
        <div className={styles.grid}>
          {uids.map((uid) => (
            <SpeakerCard key={uid} uid={uid} />
          ))}
        </div>
      )}
    </section>
  )
}
