import { Suspense } from 'react'

import BookingClient from '@/app/book-now/BookingClient'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function Page() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <ErrorBoundary componentName="Booking Page">
        <BookingClient />
      </ErrorBoundary>
    </Suspense>
  )
}
