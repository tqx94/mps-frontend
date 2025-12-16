import { supabase } from './supabaseClient'

export interface StudentDocumentData {
  url: string
  name: string
  size: number
  mimeType: string
}

export interface UploadResult {
  success: boolean
  data?: StudentDocumentData
  error?: string
}

/**
 * Upload a student verification document to Supabase Storage
 */
export async function uploadStudentDocument(
  file: File,
  userId: string
): Promise<UploadResult> {
  try {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid file type. Please upload JPG, PNG, or PDF files only.'
      }
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'File size too large. Please upload files smaller than 5MB.'
      }
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-student-verification-${Date.now()}.${fileExt}`
    const filePath = `student-documents/${fileName}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('student-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Storage upload error:', error)
      return {
        success: false,
        error: 'Failed to upload document. Please try again.'
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('student-documents')
      .getPublicUrl(filePath)

    return {
      success: true,
      data: {
        url: urlData.publicUrl,
        name: file.name,
        size: file.size,
        mimeType: file.type
      }
    }
  } catch (error) {
    console.error('Document upload error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    }
  }
}

/**
 * Delete a student verification document from Supabase Storage
 */
export async function deleteStudentDocument(fileUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Extract file path from URL
    const url = new URL(fileUrl)
    const pathParts = url.pathname.split('/')
    const filePath = pathParts.slice(-2).join('/') // Get 'student-documents/filename'

    const { error } = await supabase.storage
      .from('student-documents')
      .remove([filePath])

    if (error) {
      console.error('Storage delete error:', error)
      return {
        success: false,
        error: 'Failed to delete document.'
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Document delete error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while deleting the document.'
    }
  }
}

/**
 * Update user's student document information in the database
 */
export async function updateUserStudentDocument(
  userId: string,
  documentData: StudentDocumentData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('User')
      .update({
        studentVerificationImageUrl: documentData.url,
        studentVerificationStatus: 'PENDING',
        updatedAt: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Database update error:', error)
      return {
        success: false,
        error: 'Failed to save document information.'
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Update user document error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while saving document information.'
    }
  }
}

/**
 * Remove user's student document information from the database
 */
export async function removeUserStudentDocument(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('User')
      .update({
        studentVerificationImageUrl: null,
        studentVerificationStatus: 'NA',
        updatedAt: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Database update error:', error)
      return {
        success: false,
        error: 'Failed to remove document information.'
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Remove user document error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred while removing document information.'
    }
  }
}
