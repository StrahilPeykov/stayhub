'use client'

import { useCallback } from 'react'
import posthog from 'posthog-js'

// Initialize PostHog
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY || '', {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') posthog.debug()
    },
  })
}

export function useAnalytics() {
  const track = useCallback((event: string, properties?: Record<string, any>) => {
    if (typeof window === 'undefined' || process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== 'true') {
      console.log('[Analytics]', event, properties)
      return
    }
    
    // Send to PostHog
    posthog.capture(event, properties)
    
    // Also send to backend analytics service if needed
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, properties, timestamp: Date.now() }),
    }).catch(console.error)
  }, [])
  
  const identify = useCallback((userId: string, traits?: Record<string, any>) => {
    if (typeof window === 'undefined' || process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== 'true') {
      return
    }
    
    posthog.identify(userId, traits)
  }, [])
  
  const reset = useCallback(() => {
    if (typeof window === 'undefined' || process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== 'true') {
      return
    }
    
    posthog.reset()
  }, [])
  
  return { track, identify, reset }
}