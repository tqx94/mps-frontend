import { Suspense } from 'react'
import BuyPassClient from '@/app/buy-pass/BuyPassClient'

export default function Page() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <BuyPassClient />
    </Suspense>
  )
}