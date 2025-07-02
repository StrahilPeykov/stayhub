'use client'

import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useAnalytics } from '@/lib/hooks/useAnalytics'

function AnalyticsImpl() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { track } = useAnalytics()

  useEffect(() => {
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
    
    track('page_view', {
      url,
      path: pathname,
      referrer: document.referrer,
      screen_width: window.innerWidth,
      screen_height: window.innerHeight,
    })
  }, [pathname, searchParams, track])

  return null
}

export function Analytics() {
  return (
    <Suspense fallback={null}>
      <AnalyticsImpl />
    </Suspense>
  )
}