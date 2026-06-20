# Cadence

A polished desktop app for tracking your fitness training streak. Click a day,
check it off, and watch your consecutive-day streak grow. All data lives in a
local SQLite database on your machine — nothing leaves your computer.

## Stack

- **Electron** — cross-platform desktop shell
- **React + TypeScript** — the UI, built with **Vite** via `electron-vite`
- **better-sqlite3** — fast, synchronous, on-disk SQLite

The architecture keeps the database in Electron's main process; the React
renderer talks to it over a small, typed, sandboxed IPC bridge
(`window.cadence`). The UI never touches SQLite directly.

```
src/
  shared/      types + timezone-safe date helpers (used by main and renderer)
  main/        Electron main process — window, SQLite, IPC handlers
  preload/     contextBridge: exposes window.cadence to the renderer
  renderer/    React app (calendar grid, stats, styling)
```

## Develop

```bash
npm install         # also rebuilds the native SQLite module for Electron
npm run dev         # launch with hot reload
```

If the native module ever complains about a Node ABI mismatch:

```bash
npm run rebuild
```

## Build a distributable

```bash
npm run dist        # packaged app in ./release  (DMG on macOS)
npm run dist:dir    # unpacked app directory (faster, for local testing)
```

## Data

The database is created at Electron's per-user data directory:

- **macOS** — `~/Library/Application Support/cadence/cadence.db`
- **Windows** — `%APPDATA%/cadence/cadence.db`
- **Linux** — `~/.config/cadence/cadence.db`

### Schema

```sql
CREATE TABLE workouts (
  date_key   TEXT PRIMARY KEY,            -- 'YYYY-MM-DD' (local date)
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

A row exists for every completed day. **Current streak** counts consecutive
days back from today (a not-yet-marked today doesn't break a live streak);
**longest streak** is the longest consecutive run ever.
