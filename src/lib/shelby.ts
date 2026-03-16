import { ShelbyClient } from '@shelby-protocol/sdk/browser'
import { Network } from '@aptos-labs/ts-sdk'

const API_KEY = import.meta.env.VITE_SHELBY_API_KEY as string

console.log('[ShelbyID] API Key loaded:', API_KEY ? `${API_KEY.slice(0, 8)}...` : 'NOT FOUND ❌')

export const shelbyClient = new ShelbyClient({
  network: Network.TESTNET,
  apiKey: API_KEY,
})
