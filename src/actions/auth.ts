"use server"

import { createClient } from "@/auth/server"
import  prisma  from "@/db/prisma"
import { PhoneNumberUtil } from 'google-libphonenumber'

const phoneUtil = PhoneNumberUtil.getInstance()

function handleError(error: any) {
  console.error('Auth error:', error)
  return {
    errorMessage: error?.message || 'An unexpected error occurred'
  }
}

function isPhoneValid(phone: string): boolean {
  try {
    const parsed = phoneUtil.parseAndKeepRawInput(phone, 'SG')
    return phoneUtil.isValidNumber(parsed)
  } catch {
    return false
  }
}

function mapMemberTypeToPrisma(memberType: 'student' | 'professional' | 'freelancer'): 'STUDENT' | 'MEMBER' | 'TUTOR' {
  switch (memberType) {
    case 'student':
      return 'STUDENT'
    case 'professional':
      return 'MEMBER'
    case 'freelancer':
      return 'TUTOR' 
    default:
      return 'MEMBER'
  }
}

export const loginAction = async (
  email: string, 
  password: string, 
  captchaToken: string
) => {
  try {
    if (!captchaToken) {
      throw new Error('Please complete the captcha verification')
    }

    const client = await createClient()
    
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
      options: {
        captchaToken
      }
    })

    if (error) throw error
    return { errorMessage: null, user: data.user }
  } catch (error) {
    return handleError(error)
  }
}

export const signUpAction = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  contactNumber: string,
  memberType: 'student' | 'professional' | 'freelancer',
  captchaToken: string
) => {
  try {
    if (!captchaToken) {
      throw new Error('Please complete the captcha verification')
    }

    if (!isPhoneValid(contactNumber)) {
      throw new Error('Please enter a valid phone number')
    }

    const client = await createClient()

    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          firstName,
          lastName,
          contactNumber,
          memberType
        },
        captchaToken
      }
    })

    if (error) throw error

    const userId = data.user?.id
    if (!userId) throw new Error("Error signing up - no user ID returned")

    await prisma.user.create({
      data: {
        id: userId,
        email,
        firstName,
        lastName,
        memberType: mapMemberTypeToPrisma(memberType),
        contactNumber,
        studentVerificationStatus: memberType === 'student' ? 'PENDING' : 'NA',
      },
    })

    return { errorMessage: null, user: data.user }
  } catch (error) {
    console.error('Signup error:', error)

    return handleError(error)
  }
}

export const logOutAction = async () => {
  try {
    const client = await createClient()
    
    const { error } = await client.auth.signOut()
    if (error) throw error

    return { errorMessage: null }
  } catch (error) {
    return handleError(error)
  }
}

export const forgotPasswordAction = async (email: string, captchaToken: string) => {
  try {
    if (!captchaToken) {
      throw new Error('Please complete the captcha verification')
    }

    const client = await createClient()
    
    const { error } = await client.auth.resetPasswordForEmail(email, {
      captchaToken,
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password`
    })

    if (error) throw error

    return { errorMessage: null }
  } catch (error) {
    return handleError(error)
  }
}

export const syncUserToPrisma = async (supabaseUser: any) => {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: supabaseUser.id }
    })

    if (!existingUser) {
      await prisma.user.create({
        data: {
          id: supabaseUser.id,
          email: supabaseUser.email,
          firstName: supabaseUser.user_metadata?.firstName || null,
          lastName: supabaseUser.user_metadata?.lastName || null,
          memberType: mapMemberTypeToPrisma(supabaseUser.user_metadata?.memberType || 'professional'),
          contactNumber: supabaseUser.user_metadata?.contactNumber || null,
          studentVerificationStatus: supabaseUser.user_metadata?.memberType === 'student' ? 'PENDING' : 'NA',
        },
      })
    }

    return { success: true }
  } catch (error) {
    return { success: false, error }
  }
}