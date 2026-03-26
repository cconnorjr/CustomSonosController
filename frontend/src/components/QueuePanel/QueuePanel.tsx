import { useEffect, useState } from 'react'
import { clearQueue, getQueue } from '../../api/queue'
import type { QueueItem } from '../../store/types'
import styles from './QueuePanel.module.css'

interface Props {
  uid: string
}

export function QueuePanel({ uid }: Props) {
  const [items, setItems] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getQueue(uid)
      .then((res) => setItems(res.data.items))
      .catch((err) => {
        setItems([])
        setError(err.response?.status === 502
          ? 'Speaker not responding'
          : 'Failed to load queue')
      })
      .finally(() => setLoading(false))
  }, [uid])

  const handleClear = () => {
    clearQueue(uid)
      .then(() => setItems([]))
      .catch(() => setError('Failed to clear queue'))
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Queue ({items.length})</span>
        {items.length > 0 && (
          <button onClick={handleClear} className={styles.clearBtn}>
            Clear
          </button>
        )}
      </div>
      {loading ? (
        <p className={styles.empty}>Loading…</p>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : items.length === 0 ? (
        <p className={styles.empty}>Queue is empty</p>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.position} className={styles.item}>
              <span className={styles.pos}>{item.position + 1}</span>
              <div className={styles.info}>
                <span className={styles.itemTitle}>{item.title || 'Unknown'}</span>
                <span className={styles.itemArtist}>{item.artist}</span>
              </div>
              <span className={styles.duration}>{item.duration}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
