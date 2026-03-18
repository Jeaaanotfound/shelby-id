import { ShelbyClient } from '@shelby-protocol/sdk/browser'
import { Network } from '@aptos-labs/ts-sdk'

const API_KEY = import.meta.env.VITE_SHELBY_API_KEY as string

// Hanya log di dev mode, jangan expose di production
if (import.meta.env.DEV) {
  console.log(
    '[ShelbyID] API Key:',
    API_KEY ? `${API_KEY.slice(0, 8)}...` : 'NOT FOUND ❌'
  )
}

export const shelbyClient = new ShelbyClient({
  network: Network.TESTNET,
  apiKey: API_KEY,
})
