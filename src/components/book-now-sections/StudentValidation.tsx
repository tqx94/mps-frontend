// src/components/book-now-sections/StudentValidation.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle, Loader2, Users, GraduationCap, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// Real API response type
export type StudentVerificationResponse = {
  isStudent: boolean
  verificationStatus: 'VERIFIED' | 'PENDING' | 'REJECTED' | 'NOT_FOUND'
  message: string
  email: string
  name: string
}

export type StudentValidationStatus = {
  id: string
  studentId: string
  isValidating: boolean
  isValid: boolean
  studentData: {
    id: string
    email: string
    name: string
    memberType: string
    verifiedAt?: string
  } | null
  error: string | null
}

type StudentValidationProps = {
  numberOfStudents: number
  onValidationChange: (allValid: boolean, validatedStudents: StudentValidationStatus[]) => void
  currentUserEmail?: string // Add current user's email to prevent self-validation
}

// Real API call to validate student
const validateStudentAccount = async (email: string): Promise<StudentVerificationResponse> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/student/check-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email.trim() }),
    })

    const data = await response.json()
    return data
             } catch (error) {
         console.error('Student validation error:', error)
         return {
           isStudent: false,
           verificationStatus: 'NOT_FOUND',
           message: 'Network error. Please try again.',
           email: email,
           name: 'Unknown'
         }
       }
}

// Bulk validation API call
const validateAllStudents = async (emails: string[]): Promise<StudentVerificationResponse[]> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/student/check-multiple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ emails: emails.map(email => email.trim()) }),
    })

    const data = await response.json()
    return data.results || data // Handle different response formats
  } catch (error) {
    console.error('Bulk student validation error:', error)
    // Return individual error responses for each email
    return emails.map(email => ({
      isStudent: false,
      verificationStatus: 'NOT_FOUND' as const,
      message: 'Network error. Please try again.',
      email: email,
      name: 'Unknown'
    }))
  }
}

export function StudentValidation({ numberOfStudents, onValidationChange, currentUserEmail }: StudentValidationProps) {
  const { toast } = useToast()
  const [validations, setValidations] = useState<StudentValidationStatus[]>([])
  const [isValidatingAll, setIsValidatingAll] = useState(false)

  useEffect(() => {
    // Adjust slots when number changes
    setValidations(prev => {
      const slots: StudentValidationStatus[] = []
      for (let i = 0; i < numberOfStudents; i++) {
        slots.push(
          prev[i] || { 
            id: `student-${i+1}`, 
            studentId: '', 
            isValidating: false, 
            isValid: false, 
            studentData: null, 
            error: null 
          }
        )
      }
      return slots
    })
  }, [numberOfStudents])

  useEffect(() => {
    // Notify parent only when slots update
    const allValid = validations.length > 0 && validations.every(v => v.isValid)
    const validList = validations.filter(v => v.isValid)
    onValidationChange(allValid, validList)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validations])

  const updateSlot = (i: number, data: Partial<StudentValidationStatus>) => {
    setValidations(prev => prev.map((v, idx) => idx === i ? { ...v, ...data } : v))
  }

  const handleValidate = async (i: number) => {
    const slot = validations[i]
    if (!slot.studentId.trim()) return

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(slot.studentId.trim())) {
      updateSlot(i, { 
        isValidating: false, 
        isValid: false, 
        error: 'Please enter a valid email address' 
      })
      return
    }

    // Check for duplicate emails
    const currentEmail = slot.studentId.trim().toLowerCase()
    const duplicateIndex = validations.findIndex((v, idx) => 
      idx !== i && v.studentId.trim().toLowerCase() === currentEmail
    )
    
    if (duplicateIndex !== -1) {
      updateSlot(i, { 
        isValidating: false, 
        isValid: false, 
        error: 'This email is already being used for another student' 
      })
      return
    }

    // Check if trying to use current user's email
    if (currentUserEmail && currentEmail === currentUserEmail.toLowerCase()) {
      updateSlot(i, { 
        isValidating: false, 
        isValid: false, 
        error: 'You cannot validate your own email address here' 
      })
      return
    }

    updateSlot(i, { isValidating: true, error: null })
    
    try {
      const res = await validateStudentAccount(slot.studentId.trim())
      
                      if (res.isStudent && res.verificationStatus === 'VERIFIED') {
         updateSlot(i, { 
           isValidating: false, 
           isValid: true, 
           studentData: {
             id: 'verified',
             email: res.email,
             name: res.name,
             memberType: 'STUDENT',
             verifiedAt: new Date().toISOString()
           }, 
           error: null 
         })
         
         toast({
           title: "Student Validated",
           description: `${res.name} (${res.email}) is a verified student.`,
         })
       } else {
        updateSlot(i, { 
          isValidating: false, 
          isValid: false, 
          studentData: null, 
          error: res.message 
        })
        
        toast({
          title: "Validation Failed",
          description: res.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      updateSlot(i, { 
        isValidating: false, 
        isValid: false, 
        studentData: null, 
        error: 'Validation failed. Please try again.' 
      })
      
      toast({
        title: "Error",
        description: "Failed to validate student. Please try again.",
        variant: "destructive",
      })
    }
  }

  const clearValidation = (i: number) => {
    updateSlot(i, { 
      studentId: '', 
      isValidating: false, 
      isValid: false, 
      studentData: null, 
      error: null 
    })
  }

  const handleValidateAll = async () => {
    // Get all emails that have been entered
    const emailsToValidate = validations
      .map(v => v.studentId.trim())
      .filter(email => email.length > 0)

    if (emailsToValidate.length === 0) {
      toast({
        title: "No Students to Validate",
        description: "Please enter at least one student email address.",
        variant: "destructive"
      })
      return
    }

    // Check if ALL student slots are filled
    if (emailsToValidate.length < numberOfStudents) {
      toast({
        title: "Incomplete Student Information",
        description: `Please enter email addresses for all ${numberOfStudents} students. You have only entered ${emailsToValidate.length}.`,
        variant: "destructive"
      })
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = emailsToValidate.filter(email => !emailRegex.test(email))
    
    if (invalidEmails.length > 0) {
      toast({
        title: "Invalid Email Addresses",
        description: `Please check these email addresses: ${invalidEmails.join(', ')}`,
        variant: "destructive"
      })
      return
    }

    // Check for duplicate emails
    const emailCounts = emailsToValidate.reduce((acc, email) => {
      const lowerEmail = email.toLowerCase()
      acc[lowerEmail] = (acc[lowerEmail] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const duplicateEmails = Object.entries(emailCounts)
      .filter(([_, count]) => count > 1)
      .map(([email, _]) => email)
    
    if (duplicateEmails.length > 0) {
      toast({
        title: "Duplicate Email Addresses",
        description: `Please ensure all email addresses are unique: ${duplicateEmails.join(', ')}`,
        variant: "destructive"
      })
      return
    }

    setIsValidatingAll(true)
    
    // Set all slots to validating state
    setValidations(prev => prev.map(v => ({
      ...v,
      isValidating: v.studentId.trim().length > 0,
      error: null
    })))

    try {
      const results = await validateAllStudents(emailsToValidate)
      
      // Update each slot with its result
      setValidations(prev => prev.map(v => {
        if (!v.studentId.trim()) return v
        
        const result = results.find(r => r.email === v.studentId.trim())
        if (!result) return v

        if (result.isStudent && result.verificationStatus === 'VERIFIED') {
          return {
            ...v,
            isValidating: false,
            isValid: true,
            studentData: {
              id: 'verified',
              email: result.email,
              name: result.name,
              memberType: 'STUDENT',
              verifiedAt: new Date().toISOString()
            },
            error: null
          }
        } else {
          return {
            ...v,
            isValidating: false,
            isValid: false,
            studentData: null,
            error: result.message
          }
        }
      }))

      const successCount = results.filter(r => r.isStudent && r.verificationStatus === 'VERIFIED').length
      const totalCount = results.length

      toast({
        title: "Bulk Validation Complete",
        description: `${successCount} out of ${totalCount} students validated successfully.`,
      })

    } catch (error) {
      console.error('Bulk validation error:', error)
      toast({
        title: "Validation Failed",
        description: "Failed to validate students. Please try again.",
        variant: "destructive"
      })
      
      // Reset validating state
      setValidations(prev => prev.map(v => ({
        ...v,
        isValidating: false
      })))
    } finally {
      setIsValidatingAll(false)
    }
  }

  if (numberOfStudents === 0) return null

     return (
    <Card className="bg-orange-50 border-orange-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-orange-800">
              <GraduationCap className="h-5 w-5 mr-2" /> 
              Validate {numberOfStudents} Student{numberOfStudents > 1 ? 's' : ''}
            </CardTitle>
            <p className="text-sm text-orange-600 font-normal">
              Enter email addresses for all {numberOfStudents} students to verify their student status
            </p>
            {(() => {
              const filledCount = validations.filter(v => v.studentId.trim().length > 0).length
              const validCount = validations.filter(v => v.isValid).length
              return (
                <p className="text-xs text-orange-700 font-medium mt-1">
                  Progress: {filledCount}/{numberOfStudents} emails entered • {validCount}/{numberOfStudents} validated
                </p>
              )
            })()}
          </div>
          {numberOfStudents > 1 && (
            <Button
              type="button"
              onClick={handleValidateAll}
              disabled={isValidatingAll || validations.every(v => !v.studentId.trim())}
              className="bg-orange-600 hover:bg-orange-700 text-white"
              size="sm"
            >
              {isValidatingAll ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Validating All...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  Validate All
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {validations.map((v, i) => (
          <div key={v.id} className="space-y-2">
            <label className="text-sm font-medium text-orange-800">
              Student {i + 1} <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Enter student email address"
                value={v.studentId}
                onChange={e => {
                  const newValue = e.target.value
                  const currentEmail = newValue.trim().toLowerCase()
                  
                  let errorMessage = null
                  
                  // Check for duplicates in real-time
                  if (currentEmail !== '') {
                    const duplicateIndex = validations.findIndex((otherV, idx) => 
                      idx !== i && otherV.studentId.trim().toLowerCase() === currentEmail
                    )
                    
                    if (duplicateIndex !== -1) {
                      errorMessage = 'This email is already being used for another student'
                    } else if (currentUserEmail && currentEmail === currentUserEmail.toLowerCase()) {
                      errorMessage = 'You cannot validate your own email address here'
                    }
                  }
                  
                  updateSlot(i, { 
                    studentId: newValue, 
                    isValid: false, 
                    error: errorMessage
                  })
                }}
                disabled={v.isValidating || v.isValid}
                className={`flex-1 ${v.error && v.error.includes('already being used') ? 'border-red-500' : ''}`}
                type="email"
              />
              
                             {!v.isValid ? (
                 <Button 
                   type="button"
                   onClick={() => handleValidate(i)} 
                   disabled={!v.studentId.trim() || v.isValidating}
                   size="sm"
                   className="bg-orange-500 hover:bg-orange-600"
                 >
                   {v.isValidating ? (
                     <Loader2 className="animate-spin h-4 w-4" />
                   ) : (
                     'Validate'
                   )}
                 </Button>
              ) : (
                <Button 
                  type="button"
                  onClick={() => clearValidation(i)} 
                  variant="outline"
                  size="sm"
                >
                  Change
                </Button>
              )}
            </div>

                         {/* Validation Status */}
             {v.isValid && v.studentData && (
               <div className="flex items-center space-x-2 p-2 bg-green-50 border border-green-200 rounded-md">
                 <CheckCircle className="text-green-500 h-4 w-4" />
                 <div className="text-sm text-green-800">
                   <div className="font-medium">{v.studentData.name}</div>
                   <div className="text-xs">{v.studentData.email} • {v.studentData.memberType}</div>
                   <div className="text-xs text-green-600">✓ Verified Student</div>
                   {v.studentData.verifiedAt && (
                     <div className="text-xs text-green-600">
                       Verified: {new Date(v.studentData.verifiedAt).toLocaleDateString()}
                     </div>
                   )}
                 </div>
               </div>
             )}

                         {/* Error Message */}
             {v.error && (
               <div className="flex items-center space-x-2 p-2 bg-red-50 border border-red-200 rounded-md">
                 <XCircle className="text-red-500 h-4 w-4" />
                 <div className="text-sm text-red-800">{v.error}</div>
               </div>
             )}

          
           </div>
         ))}
       </CardContent>
     </Card>
   )
 }
