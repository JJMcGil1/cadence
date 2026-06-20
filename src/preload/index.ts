import { contextBridge, ipcRenderer } from 'electron'
import type { AppState, CadenceApi, ToggleResult } from '../shared/types'

const api: CadenceApi = {
  getState: (): Promise<AppState> => ipcRenderer.invoke('cadence:getState'),
  toggleDay: (dateKey: string): Promise<ToggleResult> =>
    ipcRenderer.invoke('cadence:toggleDay', dateKey)
}

// contextIsolation is on, so expose a minimal, typed surface to the renderer.
contextBridge.exposeInMainWorld('cadence', api)
