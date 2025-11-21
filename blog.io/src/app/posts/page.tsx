import AllPostsPage from '@/components/posts/page'
import React, { Suspense } from 'react'

const Posts = () => {
  return (
    <Suspense>
      <AllPostsPage />
    </Suspense>

  )
}

export default Posts
