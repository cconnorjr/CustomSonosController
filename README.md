# Sonos Controller

A local-network Sonos controller with a FastAPI backend, React web UI, and an Electron desktop wrapper for Windows.

Control your Sonos speakers entirely over your local network — no cloud, no Sonos account required.

---

## Architecture

```
sonos-controller/
├── backend/      FastAPI service — Sonos UPnP control via python-soco
├── frontend/     React + TypeScript UI (Vite)
└── desktop/      Electron wrapper — packages the app as a Windows desktop app
```

**How it fits together:**

- The **backend** discovers Sonos speakers on the local network and exposes a REST + WebSocket API.
- The **frontend** connects to that API and receives live state updates via WebSocket.
- The **desktop** wrapper (Electron) spawns the backend as a child process and opens the UI in a native window, so no browser is required.

---

## Prerequisites

| Requirement | Version |
|---|---|
| Python | 3.11+ |
| Node.js | 18+ |
| npm | 9+ |

Your Sonos speakers must be on the **same local network subnet** as the machine running this app.

---

## Windows — Quickest Start

Three batch files at the project root handle everything:

| File | Purpose |
|---|---|
| `install.bat` | One-time setup — creates the Python venv and installs all dependencies |
| `launch.bat` | Start the app — builds the frontend if needed, then opens the Electron window |
| `build-installer.bat` | Package a distributable Windows installer `.exe` |

**First time:**
1. Double-click `install.bat` — wait for it to finish
2. Double-click `launch.bat` — app opens in a window

**Every time after that:**
- Double-click `launch.bat`

---

## Quick Start (Development)

### 1. Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -e .

# Start the server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The API will be available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The UI will be available at `http://localhost:5173`.

### 3. Desktop (Electron) — Dev Mode

With both the backend and Vite dev server running:

```bash
cd desktop
npm install
npm run dev
```

Electron will start the backend automatically (via the `.venv` uvicorn) and load the Vite frontend.

---

## Configuration

Copy `backend/.env.example` to `backend/.env` and adjust as needed:

```env
POLL_INTERVAL_SECONDS=2.0
CORS_ORIGINS=["http://localhost:5173"]
DISCOVERY_TIMEOUT=5.0
MAX_WORKERS=10
```

---

## API Reference

All endpoints are prefixed with `/api`.

### Speakers

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/speakers` | List all discovered speakers and their state |
| `GET` | `/api/speakers/{uid}` | Get state for a single speaker |
| `POST` | `/api/speakers/discover` | Re-run network discovery |
| `GET` | `/api/speakers/{uid}/now-playing` | Current track info |

### Playback

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/speakers/{uid}/play` | Resume playback |
| `POST` | `/api/speakers/{uid}/pause` | Pause |
| `POST` | `/api/speakers/{uid}/stop` | Stop |
| `POST` | `/api/speakers/{uid}/next` | Next track |
| `POST` | `/api/speakers/{uid}/previous` | Previous track |

### Volume

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/speakers/{uid}/volume` | Get volume and mute state |
| `PUT` | `/api/speakers/{uid}/volume` | Set volume (`{"level": 0–100, "muted": bool}`) |

### Queue

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/speakers/{uid}/queue` | Get the playback queue |
| `POST` | `/api/speakers/{uid}/queue` | Add URI to queue (`{"uri": "...", "position": int}`) |
| `DELETE` | `/api/speakers/{uid}/queue` | Clear the queue |

### Groups

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/groups` | List all speaker groups |
| `POST` | `/api/groups` | Create a group (`{"coordinator_uid": "...", "member_uids": [...]}`) |
| `DELETE` | `/api/groups/{uid}` | Remove a speaker from its group |

### WebSocket

| Path | Description |
|---|---|
| `ws://localhost:8000/ws` | Real-time state stream |

On connect the server sends a `FULL_STATE` message with all speaker states. Subsequent changes are pushed as `STATE_UPDATE` messages.

```json
{ "type": "FULL_STATE", "speakers": [ ...SpeakerState ] }
{ "type": "STATE_UPDATE", "speakers": [ ...SpeakerState ] }
```

### Health

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Liveness check — returns `{"status": "ok"}` |

---

## Building the Windows Desktop App

The easiest way is to double-click **`build-installer.bat`** at the project root. It handles both steps below automatically.

### 1. Build the frontend

```bash
cd frontend
npm run build
# Outputs to frontend/dist/
```

### 2. Package with Electron Builder

```bash
cd desktop
npm run dist
# Outputs NSIS installer to desktop/dist/
```

The installer bundles:
- The Electron shell
- The full `backend/` directory including the `.venv/`
- The built `frontend/dist/`

End users do not need Python or Node.js installed.

> **Icon:** Place a 256×256 `icon.ico` at `desktop/assets/icon.ico` before packaging. To skip the icon temporarily, remove the `icon:` line from `desktop/electron-builder.yml`.

---

## Project Structure

```
backend/
  app/
    main.py               FastAPI app, lifespan, static file mount
    config.py             Settings (pydantic-settings, .env support)
    models/
      speaker.py          SpeakerState, TrackInfo, PlaybackState
      group.py            GroupState, GroupCreateRequest
      queue.py            QueueItem, QueueResponse
    routers/
      speakers.py         Speaker listing and discovery endpoints
      playback.py         Play/pause/stop/next/previous
      volume.py           Volume get/set
      queue.py            Queue management
      groups.py           Group create/delete
      websocket.py        WebSocket connection handler
    services/
      speaker_service.py  SoCo wrapper — discovery, state, controls
      poller.py           Background state poll loop + offline detection
    ws/
      manager.py          WebSocket connection manager + broadcaster

frontend/
  src/
    api/                  Axios API client functions
    components/
      SpeakerList/        Speaker grid + Rediscover button
      SpeakerCard/        Per-speaker card with status indicator
      PlayerControls/     Play/pause/stop/next/prev + album art
      VolumeSlider/       Drag-safe volume slider + mute toggle
      QueuePanel/         Queue display and clear
      GroupManager/       Group create/ungroup UI
    hooks/
      useWebSocket.ts     WebSocket hook with auto-reconnect
    store/
      useAppStore.ts      Zustand global state store
      types.ts            Shared TypeScript types

desktop/
  src/
    main.js               Electron main process
  electron-builder.yml    Windows NSIS packaging config
  package.json
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Speaker control | [python-soco](https://python-soco.com) |
| Backend framework | FastAPI |
| ASGI server | Uvicorn |
| Frontend framework | React 19 + TypeScript |
| Build tool | Vite |
| State management | Zustand |
| HTTP client | Axios |
| Desktop shell | Electron |
| Packaging | electron-builder |
