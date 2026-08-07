import { useEffect, useState } from 'react'
import type { BlobActivity, ShelbyClient } from '@shelby-protocol/sdk/browser'

interface UseBlobActivitiesParams {
  client: ShelbyClient
  blobNames: string[]
  enabled?: boolean
}

interface UseBlobActivitiesResult {
  activities: Record<string, BlobActivity | null>
  isLoading: boolean
}

function getRegistrationActivity(activities: BlobActivity[]): BlobActivity | null {
  return (
    activities
      .filter((activity) => activity.type === 'register_blob' || activity.eventType.toLowerCase().includes('register'))
      .sort((left, right) => right.transactionVersion - left.transactionVersion)[0] ?? null
  )
}

export function useBlobActivities({ client, blobNames, enabled = true }: UseBlobActivitiesParams): UseBlobActivitiesResult {
  const [activities, setActivities] = useState<Record<string, BlobActivity | null>>({})
  const [isLoading, setIsLoading] = useState(false)
  const blobNamesKey = blobNames.join('|')

  useEffect(() => {
    const names = Array.from(new Set(blobNames.filter(Boolean)))

    if (!enabled || names.length === 0) {
      setActivities({})
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)

    Promise.all(
      names.map(async (blobName) => {
        try {
          const result = await client.coordination.getBlobActivities({
            where: { object_name: { _eq: blobName } },
            pagination: { limit: 25 },
          })
          return [blobName, getRegistrationActivity(result)] as const
        } catch {
          return [blobName, null] as const
        }
      })
    ).then((entries) => {
      if (cancelled) return
      setActivities(Object.fromEntries(entries))
      setIsLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [blobNamesKey, client, enabled])

  return { activities, isLoading }
}
