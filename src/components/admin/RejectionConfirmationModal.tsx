// src/components/admin/RejectionConfirmationModal.tsx
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface RejectionConfirmationModalProps {
  isOpen: boolean
  selectedUser: any | null
  setSelectedUser: (user: any | null) => void
  onConfirmRejection: (userId: string, rejectionReason: string) => void
  isLoading: boolean
}

export default function RejectionConfirmationModal({
  isOpen,
  selectedUser,
  setSelectedUser,
  onConfirmRejection,
  isLoading
}: RejectionConfirmationModalProps) {
  const [rejectionReason, setRejectionReason] = useState('')
  const { toast } = useToast()

  const handleConfirmRejection = () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Rejection reason required",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      })
      return
    }
    
    if (selectedUser) {
      onConfirmRejection(selectedUser.id, rejectionReason.trim())
      setRejectionReason('')
    }
  }

  const handleCancel = () => {
    setRejectionReason('')
    setSelectedUser(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            Confirm Rejection
          </DialogTitle>
        </DialogHeader>
        
        {selectedUser && (
          <div className="space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                You are about to reject the student verification for <strong>{selectedUser.name}</strong>.
                This action will notify the user and they will need to resubmit their documents.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="rejectionReason" className="text-sm font-medium">
                Rejection Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="rejectionReason"
                placeholder="Please provide a clear reason for rejection (e.g., Document is not clear, Invalid student ID, etc.)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px] resize-none"
                disabled={isLoading}
              />
            
            </div>

            <div className="flex space-x-3 pt-4">
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleConfirmRejection}
                disabled={isLoading || !rejectionReason.trim()}
                className="flex-1"
              >
                {isLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
