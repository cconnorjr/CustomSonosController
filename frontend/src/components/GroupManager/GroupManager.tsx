import { useState } from 'react'
import { createGroup, ungroupSpeaker } from '../../api/groups'
import { useAppStore } from '../../store/useAppStore'
import styles from './GroupManager.module.css'

export function GroupManager() {
  const speakers = useAppStore((s) => s.speakers)
  const groups = useAppStore((s) => s.groups)
  const uids = Object.keys(speakers).filter((uid) => speakers[uid].is_online)
  const [coordinatorUid, setCoordinatorUid] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [status, setStatus] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const handleGroup = async () => {
    if (!coordinatorUid || selectedMembers.length === 0) return
    setStatus('Grouping…')
    try {
      await createGroup(coordinatorUid, selectedMembers)
      setStatus('Grouped!')
      setSelectedMembers([])
    } catch {
      setStatus('Failed to group')
    }
  }

  const handleUngroup = async (uid: string) => {
    setStatus('Ungrouping…')
    try {
      await ungroupSpeaker(uid)
      setStatus('Ungrouped!')
    } catch {
      setStatus('Failed to ungroup')
    }
  }

  const toggleMember = (uid: string) => {
    setSelectedMembers((prev) =>
      prev.includes(uid) ? prev.filter((u) => u !== uid) : [...prev, uid],
    )
  }

  const toggleGroupExpanded = (groupUid: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupUid)) {
        next.delete(groupUid)
      } else {
        next.add(groupUid)
      }
      return next
    })
  }

  const activeGroups = groups.filter((g) => g.member_uids.length > 1)

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Group Manager</h2>

      <div className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Coordinator</label>
          <select
            value={coordinatorUid}
            onChange={(e) => setCoordinatorUid(e.target.value)}
            className={styles.select}
          >
            <option value="">Select coordinator…</option>
            {uids.map((uid) => (
              <option key={uid} value={uid}>
                {speakers[uid].name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Add members</label>
          <div className={styles.checkboxes}>
            {uids
              .filter((uid) => uid !== coordinatorUid)
              .map((uid) => (
                <label key={uid} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(uid)}
                    onChange={() => toggleMember(uid)}
                  />
                  {speakers[uid].name}
                </label>
              ))}
          </div>
        </div>

        <button
          onClick={handleGroup}
          disabled={!coordinatorUid || selectedMembers.length === 0}
          className={styles.btn}
        >
          Create Group
        </button>
        {status && <span className={styles.status}>{status}</span>}
      </div>

      {activeGroups.length > 0 && (
        <div className={styles.activeGroups}>
          <h3 className={styles.subheading}>Active Groups</h3>
          {activeGroups.map((group) => {
            const isExpanded = expandedGroups.has(group.group_uid)
            return (
              <div key={group.group_uid} className={styles.groupItem}>
                <button
                  className={styles.groupHeader}
                  onClick={() => toggleGroupExpanded(group.group_uid)}
                  aria-expanded={isExpanded}
                >
                  <span className={styles.groupChevron} data-expanded={isExpanded}>
                    &#9654;
                  </span>
                  <span className={styles.groupName}>{group.coordinator_name}</span>
                  <span className={styles.groupCount}>
                    {group.member_uids.length} speaker{group.member_uids.length !== 1 && 's'}
                  </span>
                </button>
                {isExpanded && (
                  <ul className={styles.memberList}>
                    {group.member_uids.map((memberUid, i) => (
                      <li key={memberUid} className={styles.memberItem}>
                        {group.member_names[i] ?? memberUid}
                        {memberUid === group.coordinator_uid && (
                          <span className={styles.coordinatorBadge}>coordinator</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className={styles.currentGroups}>
        <h3 className={styles.subheading}>Ungroup a speaker</h3>
        <div className={styles.ungroupList}>
          {uids
            .filter((uid) => speakers[uid].group_members.length > 1)
            .map((uid) => (
              <button
                key={uid}
                onClick={() => handleUngroup(uid)}
                className={styles.ungroupBtn}
              >
                {speakers[uid].name}
              </button>
            ))}
          {uids.filter((uid) => speakers[uid].group_members.length > 1).length === 0 && (
            <p className={styles.noGroups}>No grouped speakers</p>
          )}
        </div>
      </div>
    </section>
  )
}
