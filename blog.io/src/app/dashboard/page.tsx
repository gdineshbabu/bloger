import DashboardPage from '@/components/dashboard/dashboard'
import React, { Suspense } from 'react'

const Dashboard = () => {
  return (
    <Suspense>
      <DashboardPage />
    </Suspense>
  )
}

export default Dashboard
