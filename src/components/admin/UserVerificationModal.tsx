// src/components/admin/UserVerificationModal.tsx
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FileText, Eye, CheckCircle, XCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface UserVerificationModalProps {
  selectedUser: any | null
  setSelectedUser: (user: any | null) => void
  handleUserVerification: (user: any, action: 'verify' | 'reject', rejectionReason?: string) => void
  isLoading: boolean
  onRefresh?: () => void
}

export default function UserVerificationModal({
  selectedUser,
  setSelectedUser,
  handleUserVerification,
  isLoading,
  onRefresh
}: UserVerificationModalProps) {
  const [verificationStatus, setVerificationStatus] = useState<'verify' | 'reject' | ''>('')
  const [rejectionReason, setRejectionReason] = useState('')
  const { toast } = useToast()

  const handleStatusChange = (status: 'verify' | 'reject') => {
    setVerificationStatus(status)
    // Clear rejection reason when switching to verify
    if (status === 'verify') {
      setRejectionReason('')
    }
  }

  const handleSubmit = async () => {
    if (verificationStatus === 'reject' && !rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      })
      return
    }

    try {
      await handleUserVerification(selectedUser, verificationStatus as 'verify' | 'reject', rejectionReason)
      toast({
        title: verificationStatus === 'verify' ? "Verification Successful" : "Rejection Successful",
        description: verificationStatus === 'verify' 
          ? "User has been verified successfully." 
          : "User has been rejected successfully.",
      })
      if (onRefresh) onRefresh()
      handleCloseModal()
    } catch (error) {
      console.error('Action failed:', error)
    }
  }

  const handleCloseModal = () => {
    setSelectedUser(null)
    setVerificationStatus('')
    setRejectionReason('')
  }

  // Format user name
  const getUserName = (user: any) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    return user.email?.split('@')[0] || 'Unknown User'
  }

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return 'N/A'
    }
  }

  return (
    <Dialog open={!!selectedUser} onOpenChange={handleCloseModal}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>User Verification Review</DialogTitle>
        </DialogHeader>
        {selectedUser && (
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {/* User Information - Modern Vertical Layout */}
            <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              {/* User Avatar & Basic Info */}
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {getUserName(selectedUser).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900">{getUserName(selectedUser)}</h3>
                  <p className="text-gray-600">{selectedUser.email}</p>
                  <div className="flex items-center space-x-3">
                    <Badge className="bg-blue-100 text-blue-800 capitalize px-3 py-1">
                      {selectedUser.memberType}
                    </Badge>
                    {selectedUser.memberType === 'STUDENT' && selectedUser.studentVerificationImageUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(selectedUser.studentVerificationImageUrl, '_blank')}
                        className="h-8 w-8 p-0 hover:bg-orange-100 rounded-full"
                      >
                        <Eye className="w-4 h-4 text-orange-600" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* User Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">Join Date</span>
                  </div>
                  <p className="text-gray-900 font-medium ml-5">{formatDate(selectedUser.createdAt)}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">Contact Number</span>
                  </div>
                  <p className="text-gray-900 font-medium ml-5">{selectedUser.contactNumber || 'Not provided'}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">Verification Status</span>
                  </div>
                  <Badge className="ml-5 bg-orange-100 text-orange-800 px-3 py-1">
                    {selectedUser.studentVerificationStatus || 'PENDING'}
                  </Badge>
                </div>

              
              </div>
            </div>

     
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Verification Decision</h3>
              <RadioGroup 
                value={verificationStatus} 
                onValueChange={(value) => handleStatusChange(value as 'verify' | 'reject')}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-green-50">
                  <RadioGroupItem value="verify" id="verify" />
                  <Label htmlFor="verify" className="flex items-center space-x-2 cursor-pointer flex-1">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">Approve Verification</p>
                      <p className="text-sm text-green-600">Verify this user's student status</p>
                    </div>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-red-50">
                  <RadioGroupItem value="reject" id="reject" />
                  <Label htmlFor="reject" className="flex items-center space-x-2 cursor-pointer flex-1">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-800">Reject Verification</p>
                      <p className="text-sm text-red-600">Reject this user's student status</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              {/* Rejection Reason Input */}
              {verificationStatus === 'reject' && (
                <div className="space-y-2">
                  <Label htmlFor="rejectionReason" className="text-sm font-medium">
                    Rejection Reason <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="rejectionReason"
                    placeholder="Please provide a reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              )}
            </div>

          </div>
        )}
        
        {/* Action Buttons - Sticky at bottom */}
        <div className="flex-shrink-0 border-t pt-4 mt-4">
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={handleCloseModal}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            {verificationStatus && (
              <Button 
                onClick={handleSubmit}
                disabled={isLoading || (verificationStatus === 'reject' && !rejectionReason.trim())}
                className={`flex-1 ${
                  verificationStatus === 'verify' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isLoading ? 'Processing...' : `Submit ${verificationStatus === 'verify' ? 'Approval' : 'Rejection'}`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

