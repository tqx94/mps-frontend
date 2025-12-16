// src/components/admin/CancellationReviewModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export default function CancellationReviewModal({
  selectedCancellation,
  setSelectedCancellation,
  handleCancellationAction,
  isLoading
}:any) {
  return (
    <Dialog open={!!selectedCancellation} onOpenChange={() => setSelectedCancellation(null)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review Cancellation Request</DialogTitle>
        </DialogHeader>
        {selectedCancellation && (
          <div className="space-y-4">
            <p><strong>Booking:</strong> {selectedCancellation.bookingReference}</p>
            <Alert>
              <AlertDescription>
                Refund: ${selectedCancellation.refundAmount}
              </AlertDescription>
            </Alert>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setSelectedCancellation(null)}>Close</Button>
              <Button variant="destructive" onClick={() => handleCancellationAction(selectedCancellation, 'reject')} disabled={isLoading}>
                Reject
              </Button>
              <Button onClick={() => handleCancellationAction(selectedCancellation, 'approve')} disabled={isLoading}>
                Approve Refund
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
