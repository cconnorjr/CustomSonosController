import { GroupManager } from './components/GroupManager/GroupManager'
import { SpeakerList } from './components/SpeakerList/SpeakerList'
import { useWebSocket } from './hooks/useWebSocket'

export default function App() {
  useWebSocket()

  return (
    <div className="app">
      <header className="app-header">
        <h1>Sonos Controller</h1>
      </header>
      <main className="app-main">
        <SpeakerList />
        <GroupManager />
      </main>
    </div>
  )
}
