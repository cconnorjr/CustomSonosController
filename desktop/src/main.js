'use strict'

const { app, BrowserWindow, dialog } = require('electron')
const { spawn, execSync } = require('child_process')
const path = require('path')
const http = require('http')

const IS_DEV = process.env.NODE_ENV === 'development'
const BACKEND_PORT = 8000
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`
const FRONTEND_URL = IS_DEV ? 'http://localhost:5173' : BACKEND_URL

let mainWindow = null
let backendProcess = null

// ---------------------------------------------------------------------------
// Backend paths
// ---------------------------------------------------------------------------

function getBackendPaths() {
  if (app.isPackaged) {
    const base = path.join(process.resourcesPath, 'backend')
    return {
      uvicorn: path.join(base, '.venv', 'Scripts', 'uvicorn.exe'),
      cwd: base,
      staticDir: path.join(process.resourcesPath, 'frontend_dist'),
    }
  }
  const base = path.resolve(__dirname, '..', '..', 'backend')
  return {
    uvicorn: path.join(base, '.venv', 'Scripts', 'uvicorn.exe'),
    cwd: base,
    staticDir: path.resolve(__dirname, '..', '..', 'frontend', 'dist'),
  }
}

// ---------------------------------------------------------------------------
// Backend lifecycle
// ---------------------------------------------------------------------------

function startBackend() {
  const { uvicorn, cwd, staticDir } = getBackendPaths()

  backendProcess = spawn(
    uvicorn,
    ['app.main:app', '--host', '127.0.0.1', '--port', String(BACKEND_PORT)],
    {
      cwd,
      env: { ...process.env, STATIC_DIR: staticDir },
      windowsHide: true,
      stdio: 'inherit',
    }
  )

  backendProcess.on('error', (err) => {
    console.error('[backend] failed to start:', err.message)
  })

  backendProcess.on('exit', (code) => {
    console.log(`[backend] exited with code ${code}`)
    backendProcess = null
  })
}

function killBackend() {
  if (!backendProcess) return
  const pid = backendProcess.pid
  backendProcess = null
  try {
    // /T kills the whole process tree; /F forces termination — required on Windows
    execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' })
  } catch (_) {
    // process may have already exited
  }
}

// ---------------------------------------------------------------------------
// Wait for backend to accept connections
// ---------------------------------------------------------------------------

function waitForBackend(retries = 40, delayMs = 500) {
  return new Promise((resolve, reject) => {
    let attempts = 0

    function attempt() {
      const req = http.get(`${BACKEND_URL}/health`, (res) => {
        if (res.statusCode === 200) {
          resolve()
        } else {
          retry()
        }
        // Drain the response so the socket closes
        res.resume()
      })
      req.on('error', retry)
      req.setTimeout(400, () => { req.destroy(); retry() })
    }

    function retry() {
      if (++attempts >= retries) {
        reject(new Error(`Backend did not become ready after ${retries} attempts`))
        return
      }
      setTimeout(attempt, delayMs)
    }

    attempt()
  })
}

// ---------------------------------------------------------------------------
// Window
// ---------------------------------------------------------------------------

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 800,
    minHeight: 600,
    title: 'Sonos Controller',
    show: false,
    backgroundColor: '#1a1a2e',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  })

  mainWindow.loadURL(FRONTEND_URL)

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Open external links in the system browser, not in Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url)
    return { action: 'deny' }
  })
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

function isBackendRunning() {
  return new Promise((resolve) => {
    const req = http.get(`${BACKEND_URL}/health`, (res) => {
      resolve(res.statusCode === 200)
      res.resume()
    })
    req.on('error', () => resolve(false))
    req.setTimeout(500, () => { req.destroy(); resolve(false) })
  })
}

app.whenReady().then(async () => {
  const alreadyRunning = await isBackendRunning()
  if (!alreadyRunning) {
    startBackend()
  } else {
    console.log('[backend] already running, skipping spawn')
  }

  try {
    await waitForBackend()
    createWindow()
  } catch (err) {
    dialog.showErrorBox(
      'Startup Error',
      `The Sonos Controller backend failed to start.\n\n${err.message}\n\nMake sure the Python virtual environment is set up correctly.`
    )
    app.quit()
  }
})

app.on('before-quit', killBackend)

app.on('window-all-closed', () => {
  app.quit()
})
