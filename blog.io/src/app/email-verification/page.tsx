import EmailVerificationPage from '@/app/email-verification/page'
import React, { Suspense } from 'react'

const EmailVerification = () => {
  return (
    <Suspense>
        <EmailVerificationPage/>
    </Suspense>
  )
}

export default EmailVerification
