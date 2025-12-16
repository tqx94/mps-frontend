'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Trash2, 
  AlertCircle,
  GraduationCap,
  Image as ImageIcon,
  FileIcon
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { uploadStudentDocument, deleteStudentDocument, updateUserStudentDocument, removeUserStudentDocument, type StudentDocumentData } from '@/lib/studentDocumentService'

interface StudentDocumentUploadProps {
  onDocumentUploaded: (documentData: StudentDocumentData) => void
  onDocumentRemoved: () => void
  initialDocument?: StudentDocumentData | null
  disabled?: boolean
  userId?: string // Required for actual uploads
}

const ACCEPTED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png'
]

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// Removed document type selection to simplify the interface

export function StudentDocumentUpload({
  onDocumentUploaded,
  onDocumentRemoved,
  initialDocument,
  disabled = false,
  userId
}: StudentDocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = useCallback((file: File) => {
    setError(null)
    
    // Validate file type
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      setError('Please upload a valid image file (JPG or PNG)')
      return
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be less than 5MB')
      return
    }
    
    setSelectedFile(file)
    
    // Create preview URL
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const uploadToSupabase = async (file: File) => {
    if (!userId) {
      throw new Error('User ID is required for document upload')
    }

    // Simulate progress for better UX
    let progress = 0
    const progressInterval = setInterval(() => {
      progress += Math.random() * 20
      if (progress >= 90) {
        progress = 90
        clearInterval(progressInterval)
      }
      setUploadProgress(progress)
    }, 200)

    try {
      const result = await uploadStudentDocument(file, userId)
      
      if (!result.success) {
        throw new Error(result.error || 'Upload failed')
      }

      // Update progress to 100%
      setUploadProgress(100)
      
      return result.data!
    } finally {
      clearInterval(progressInterval)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload')
      return
    }

    setIsUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      let uploadResult: StudentDocumentData

      if (userId) {
        // Real upload to Supabase
        uploadResult = await uploadToSupabase(selectedFile)
        
        // Save document info to database
        const dbResult = await updateUserStudentDocument(userId, uploadResult)
        
        if (!dbResult.success) {
          throw new Error(dbResult.error || 'Failed to save document information')
        }

        toast({
          title: "Image uploaded successfully!",
          description: "Your student verification image has been uploaded and will be reviewed by our admin team. Please check back in 2-3 days for student verification update",
        })
      } else {
        // Preview mode during signup - just prepare the data
        uploadResult = {
          url: URL.createObjectURL(selectedFile), // Temporary URL for preview
          name: selectedFile.name,
          size: selectedFile.size,
          mimeType: selectedFile.type
        }

        toast({
          title: "Image ready for upload!",
          description: "Your image will be uploaded when you complete the signup process.",
        })
      }

      onDocumentUploaded(uploadResult)

      // Reset form
      setSelectedFile(null)
      setPreviewUrl(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Upload error:', error)
      setError(error instanceof Error ? error.message : 'Failed to upload image. Please try again.')
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleRemove = async () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    // If there's an existing document, remove it from storage and database
    if (initialDocument && userId) {
      try {
        // Remove from storage
        await deleteStudentDocument(initialDocument.url)
        
        // Remove from database
        await removeUserStudentDocument(userId)
        
        toast({
          title: "Image removed",
          description: "Your student verification image has been removed.",
        })
      } catch (error) {
        console.error('Remove error:', error)
        toast({
          title: "Remove failed",
          description: "Failed to remove image. Please try again.",
          variant: "destructive",
        })
      }
    }

    onDocumentRemoved()
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="w-8 h-8 text-blue-500" />
    }
    return <FileIcon className="w-8 h-8 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-2">
      <Card className="border-2 border-dashed border-orange-200 bg-orange-50/50">
        <CardHeader className="pb-1">
          <CardTitle className="flex items-center gap-2 text-orange-800 text-xs">
            <GraduationCap className="w-3 h-3" />
            Student Verification Image
          </CardTitle>
          <p className="text-xs text-orange-700">
            Upload a valid student image to verify your student status.
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* File Upload Area */}
          <div>
            <Label className="text-xs font-medium mb-1 block">Upload Image *</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-3 text-center transition-colors ${
                disabled 
                  ? "border-gray-300 bg-gray-50 cursor-not-allowed" 
                  : "border-orange-300 hover:border-orange-400 cursor-pointer"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => !disabled && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleFileChange}
                className="hidden"
                disabled={disabled}
              />
              
              {selectedFile ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    {getFileIcon(selectedFile.type)}
                    <div className="text-left">
                      <p className="font-medium text-gray-900 text-xs">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                  
                  {previewUrl && (
                    <div className="max-w-xs mx-auto">
                      <img 
                        src={previewUrl} 
                        alt="Document preview" 
                        className="w-full h-16 object-cover rounded border"
                      />
                    </div>
                  )}
                  
                  <div className="flex gap-2 justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemove()
                      }}
                      disabled={disabled}
                      className="h-6 text-xs"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="w-6 h-6 text-orange-400 mx-auto" />
                  <div>
                    <p className="text-xs font-medium text-gray-900">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      JPG or PNG (max 5MB)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-orange-700 font-medium">Uploading...</span>
                <span className="text-orange-600 font-semibold">{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full h-1 bg-orange-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 transition-all duration-300 ease-in-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive" className="py-1">
              <AlertCircle className="h-3 w-3" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          {/* Upload Button */}
          {selectedFile && !isUploading && (
            <Button
              onClick={handleUpload}
              className="w-full bg-orange-500 hover:bg-orange-600 h-6 text-xs"
              disabled={disabled}
            >
              <Upload className="w-3 h-3 mr-1" />
              Click to upload Image
            </Button>
          )}

          {/* Current Document Display */}
          {initialDocument && !selectedFile && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800 text-xs">{initialDocument.name}</p>
                    <p className="text-xs text-green-600">
                      {formatFileSize(initialDocument.size)} • {initialDocument.mimeType}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(initialDocument.url, '_blank')}
                    disabled={disabled}
                    className="h-5 w-5 p-0"
                  >
                    <Eye className="w-3 h-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemove}
                    disabled={disabled}
                    className="h-5 w-5 p-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-1">
        <h4 className="font-medium text-blue-800 mb-1 text-xs">📋 Image Requirements</h4>
        <ul className="text-xs text-blue-700 space-y-0.5">
          <li>• Image must clearly show your name and student status</li>
          <li>• Accepted formats: JPG, PNG (max 5MB)</li>
          <li>• Verification typically takes 1-2 business days</li>
        </ul>
      </div>
    </div>
  )
}
