import LivePreviewPage from '@/components/live-preview/page'
import React, { Suspense } from 'react'

const LivePreview = () => {
  return (
    <Suspense>
      <LivePreviewPage />
    </Suspense>

  )
}

export default LivePreview
