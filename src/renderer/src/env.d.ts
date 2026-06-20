/// <reference types="vite/client" />

import type { CadenceApi } from '../../shared/types'

declare global {
  interface Window {
    cadence: CadenceApi
  }
}
