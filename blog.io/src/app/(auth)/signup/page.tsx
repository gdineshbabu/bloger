import SignupPage from '@/components/forms/signUp'
import React, { Suspense } from 'react'

const SignUp = () => {
  return (
    <Suspense>
      <SignupPage />
    </Suspense>
  )
}

export default SignUp
