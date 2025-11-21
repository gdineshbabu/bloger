import VersionPreviewPage from '@/components/version-preview/page'
import React, { Suspense } from 'react'

const versionPreview = () => {
  return (
    <Suspense>
      <VersionPreviewPage />
    </Suspense>
  )
}

export default versionPreview
