// src/app/reset-password/page.tsx - Step 2: User sets new password (Fixed with Suspense)
import { Suspense } from 'react'
import ResetPasswordClient from '@/app/reset-password/ResetPasswordClient.tsx'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordClient />
    </Suspense>
  )
}