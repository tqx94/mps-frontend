// src/components/Navbar.tsx - Updated for client-side auth
'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Menu, X, ChevronDown, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/hooks/use-toast'

type Section = {
  name: string
  href?: string
  children?: { name: string; href: string }[]
}

const sections: Section[] = [
  { name: 'Book Now', href: '/#BookNow' },
  { name: "Announcements", href: "/#LatestAnnouncements" },
  { name: 'About', href: '/#About' },
  { name: 'Locations', href: '/#Locations' },
  { name: 'Pricing', href: '/#Pricing' },
  {
    name: 'Co-Infos',
    children: [
      { name: 'Co-Working Solutions', href: '/cowork' },
      { name: 'Co-Tutoring Solutions', href: '/colearn' },
      { name: 'Co-Students Solutions', href: '/costudy' },
    ],
  },
  {
    name: 'More',
    children: [
      { name: 'Why Us', href: '/#WhyUs' },
      { name: 'Booking Guide', href: '/#BookingGuide' },
      { name: 'Feedback', href: '/#Feedback' },
      { name: 'FAQ', href: '/#FAQ' },
    ],
  },
  { name: 'Contact Us', href: '/#ContactUs' },
]

export default function Navbar() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, databaseUser, loading: authLoading, isLoggedIn } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)

  const avatarUrl = user?.user_metadata?.avatar_url || '/profilepic/default-avatar.png'

  const handleLogout = async () => {
    setLogoutLoading(true)
    try {
      // Clear local storage immediately for faster UX
      localStorage.removeItem('auth_user')
      localStorage.removeItem('database_user')

      // Navigate first
      router.push('/?toastType=logOut')

      // Then sign out in background
      await supabase.auth.signOut()
    } catch (error: any) {
      console.error('Logout error:', error)
      // Still navigate even if signOut fails
      router.push('/?toastType=logOut')
    } finally {
      setLogoutLoading(false)
    }
  }



  return (
    <nav className="fixed top-0 left-0 right-0 bg-[#efefe7]/80 backdrop-blur z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between py-4">
        {/* logo + description */}
        <div className="flex-shrink-0 flex flex-col items-start">
          <Link href="/" className="flex-shrink-0 flex flex-col items-start hover:opacity-80 transition-opacity">
            <Image
              src='/mock_img/logo5.png'
              alt="MyProductiveSpace logo"
              width={150}
              height={20}
              priority
            />
            <span className="mt-1 text-sm text-gray-600">
              co-work • co-learn • co-study
            </span>
          </Link>
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center space-x-6">
          {sections.map((sec) =>
            sec.children ? (
              <DropdownMenu key={sec.name}>
                <DropdownMenuTrigger className="flex items-center hover:underline">
                  {sec.name}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {sec.children.map((child) => (
                    <DropdownMenuItem key={child.name} asChild>
                      <a href={child.href}>{child.name}</a>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <a
                key={sec.name}
                href={sec.href}
                className="hover:underline capitalize"
              >
                {sec.name}
              </a>
            )
          )}
        </div>

        {/* Auth / Profile - Desktop */}
        <div className="hidden md:flex items-center space-x-4">
          {authLoading ? (
            <Loader2 className="animate-spin h-5 w-5" />
          ) : isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer">
                  <Image
                    src={avatarUrl}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <span className="text-sm font-medium">
                    {databaseUser?.name || user?.user_metadata?.firstName || "User"}
                  </span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {databaseUser?.memberType === 'ADMIN' && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">Admin Dashboard</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={logoutLoading}
                  className="cursor-pointer"
                >
                  {logoutLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Logging out...
                    </div>
                  ) : (
                    "Logout"
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button
                className="text-white hover:bg-orange-500 hover:text-white transition-colors duration-200"
                asChild
              >
                <Link href="/sign-up">Sign Up</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile hamburger menu button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu panel */}
      {mobileOpen && (
        <div className="md:hidden bg-[#efefe7]/90 backdrop-blur">
          <div className="px-6 pb-4 space-y-2">
            {sections.map((sec) =>
              sec.children ? (
                <div key={sec.name}>
                  <div className="flex items-center justify-between py-2">
                    <span className="font-semibold">{sec.name}</span>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                  <div className="pl-4">
                    {sec.children.map((child) => (
                      <a
                        key={child.name}
                        href={child.href}
                        className="block py-1 hover:underline"
                        onClick={() => setMobileOpen(false)}
                      >
                        {child.name}
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <a
                  key={sec.name}
                  href={sec.href}
                  className="block py-2 hover:underline"
                  onClick={() => setMobileOpen(false)}
                >
                  {sec.name}
                </a>
              )
            )}

            <div className="pt-2 border-t border-gray-200">
              {authLoading ? (
                <div className="flex items-center justify-center w-full">
                  <Loader2 className="animate-spin h-5 w-5" />
                </div>
              ) : user ? (
                <div className="space-y-2">
                  {databaseUser?.memberType === 'ADMIN' && (
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        router.push('/admin')
                        setMobileOpen(false)
                      }}
                    >
                      Admin Dashboard
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      router.push('/dashboard')
                      setMobileOpen(false)
                    }}
                  >
                    Dashboard
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={handleLogout}
                    disabled={logoutLoading}
                  >
                    {logoutLoading ? (
                      <Loader2 className="animate-spin h-4 w-4" />
                    ) : (
                      "Logout"
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex space-x-4">
                  <Button
                    variant="ghost"
                    className="flex-1"
                    onClick={() => {
                      router.push('/login')
                      setMobileOpen(false)
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    className="flex-1 text-white hover:bg-orange-500 hover:text-white transition-colors duration-200"
                    onClick={() => {
                      router.push('/sign-up')
                      setMobileOpen(false)
                    }}
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}