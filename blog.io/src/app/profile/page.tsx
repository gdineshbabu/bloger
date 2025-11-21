import ProfilePage from '@/components/profile/page';
import React, { Suspense } from 'react'

const Profile = () => {
  return (
    <Suspense>
      <ProfilePage />
    </Suspense>

  )
}

export default Profile;
