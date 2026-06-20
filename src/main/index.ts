import { join } from 'node:path'
import { app, shell, session, BrowserWindow } from 'electron'
import { initDb } from './db'
import { registerIpcHandlers } from './ipc'

const RENDERER_URL = process.env['ELECTRON_RENDERER_URL']

// Strict CSP for the packaged app, applied as a response header (more robust
// than a <meta> tag). NOT applied in dev, where it would block Vite's inline
// HMR/React-refresh preamble script and break the dev renderer.
function applyContentSecurityPolicy(): void {
  if (RENDERER_URL) return
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'"
        ]
      }
    })
  })
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 900,
    height: 780,
    minWidth: 760,
    minHeight: 640,
    show: false,
    backgroundColor: '#0b0c10',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 18, y: 22 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.on('ready-to-show', () => win.show())

  // Open external links in the user's browser — but only safe web/mail schemes,
  // never file://, custom protocol handlers, etc.
  win.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const { protocol } = new URL(url)
      if (protocol === 'https:' || protocol === 'http:' || protocol === 'mailto:') {
        shell.openExternal(url)
      }
    } catch {
      // Ignore unparseable URLs.
    }
    return { action: 'deny' }
  })

  // Never let the app frame itself navigate away from our local content.
  win.webContents.on('will-navigate', (event, url) => {
    const allowed = RENDERER_URL ? url.startsWith(RENDERER_URL) : url.startsWith('file://')
    if (!allowed) event.preventDefault()
  })

  if (RENDERER_URL) {
    win.loadURL(RENDERER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Defense-in-depth: this app never uses <webview>, so deny all attachments.
app.on('web-contents-created', (_event, contents) => {
  contents.on('will-attach-webview', (event) => event.preventDefault())
})

app.whenReady().then(() => {
  initDb()
  registerIpcHandlers()
  applyContentSecurityPolicy()
  createWindow()

  app.on('activate', () => {
    // macOS: re-create a window when the dock icon is clicked and none are open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  // macOS apps typically stay alive until the user quits explicitly.
  if (process.platform !== 'darwin') app.quit()
})
