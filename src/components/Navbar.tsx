// src/components/Navbar.tsx - Updated for client-side auth
'use client'

import { useState, useEffect } from 'react'
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
  const { user, databaseUser, loading: authLoading, isLoggedIn, refreshDatabaseUser } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [expandedDropdowns, setExpandedDropdowns] = useState<Set<string>>(new Set())

  // Ensure databaseUser is loaded if user exists
  useEffect(() => {
    if (user && !databaseUser && !authLoading) {
      refreshDatabaseUser()
    }
  }, [user, databaseUser, authLoading, refreshDatabaseUser])

  // Check if user is admin - check both databaseUser and user metadata
  const isAdmin = databaseUser?.memberType === 'ADMIN' || user?.user_metadata?.memberType === 'ADMIN'

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

  const toggleDropdown = (name: string) => {
    setExpandedDropdowns((prev) => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }

  // Close mobile menu when clicking outside or on link
  const closeMobileMenu = () => {
    setMobileOpen(false)
    setExpandedDropdowns(new Set())
  }

  return (
    <nav className="fixed top-0 left-0 right-0 bg-[#efefe7]/80 backdrop-blur-md z-50 shadow-sm overflow-x-hidden">
      <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-5 flex items-center justify-between py-2 sm:py-3 md:py-4 overflow-x-hidden">
        {/* logo + description */}
        <div className="flex-shrink-0 flex flex-col items-start min-w-0">
          <Link 
            href="/" 
            className="flex-shrink-0 flex flex-col items-start hover:opacity-80 transition-opacity"
            onClick={closeMobileMenu}
          >
            <div className="relative w-[120px] sm:w-[120px] md:w-[130px] lg:w-[150px] h-auto">
              <Image
                src='/mock_img/logo5.png'
                alt="MyProductiveSpace logo"
                width={150}
                height={20}
                priority
                className="w-full h-auto object-contain"
              />
            </div>
            <span className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs md:text-sm text-gray-600 hidden sm:block whitespace-nowrap">
              co-work • co-learn • co-study
            </span>
          </Link>
        </div>

        {/* Desktop links - Show on lg screens and above */}
        <div className="hidden lg:flex items-center space-x-2 xl:space-x-3 2xl:space-x-4 flex-wrap justify-center flex-1 min-w-0 mx-2 xl:mx-4">
          {sections.map((sec) =>
            sec.children ? (
              <DropdownMenu key={sec.name}>
                <DropdownMenuTrigger className="flex items-center hover:underline text-sm xl:text-base px-2 py-1 rounded transition-colors hover:bg-white/50">
                  {sec.name}
                  <ChevronDown className="ml-1 h-3 w-3 xl:h-4 xl:w-4" />
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
                className="hover:underline capitalize text-sm xl:text-base px-2 py-1 rounded transition-colors hover:bg-white/50 whitespace-nowrap"
              >
                {sec.name}
              </a>
            )
          )}
        </div>

        {/* Auth / Profile - Desktop - Show on lg screens and above */}
        <div className="hidden lg:flex items-center space-x-2 xl:space-x-4 flex-shrink-0">
          {authLoading ? (
            <Loader2 className="animate-spin h-5 w-5" />
          ) : isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity px-2 py-1 rounded">
                  <Image
                    src={avatarUrl}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="rounded-full w-7 h-7 xl:w-8 xl:h-8 object-cover"
                  />
                  <span className="text-xs xl:text-sm font-medium max-w-[100px] xl:max-w-[150px] truncate">
                    {databaseUser?.name || user?.user_metadata?.firstName || "User"}
                  </span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(databaseUser?.memberType === 'ADMIN' || user?.user_metadata?.memberType === 'ADMIN') && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">Admin Dashboard</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/dashboard#overview">Dashboard</Link>
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
              <Button variant="ghost" asChild className="text-xs xl:text-sm px-3 xl:px-4">
                <Link href="/login">Login</Link>
              </Button>
              <Button
                className="text-white hover:bg-orange-500 hover:text-white transition-colors duration-200 text-xs xl:text-sm px-3 xl:px-4"
                asChild
              >
                <Link href="/sign-up">Sign Up</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile hamburger menu button - Show below lg */}
        <button
          className="lg:hidden p-2 -mr-2 flex-shrink-0 hover:bg-white/50 rounded transition-colors"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          ) : (
            <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
          )}
        </button>
      </div>

      {/* Mobile menu panel - Animated */}
      <div 
        className={`lg:hidden bg-[#efefe7]/95 backdrop-blur-md border-t border-gray-200/50 transition-all duration-300 ease-in-out overflow-hidden ${
          mobileOpen ? 'max-h-[90vh] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 sm:px-5 md:px-6 py-4 space-y-1 overflow-y-auto max-h-[calc(90vh-80px)]">
          {sections.map((sec) =>
            sec.children ? (
              <div key={sec.name} className="border-b border-gray-200/50 last:border-b-0 pb-2 last:pb-0">
                <button
                  onClick={() => toggleDropdown(sec.name)}
                  className="w-full flex items-center justify-between py-2.5 px-2 hover:bg-white/50 rounded transition-colors"
                >
                  <span className="font-semibold text-sm sm:text-base capitalize">{sec.name}</span>
                  <ChevronDown 
                    className={`h-4 w-4 transition-transform duration-200 ${
                      expandedDropdowns.has(sec.name) ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    expandedDropdowns.has(sec.name) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="pl-4 pr-2 pt-1 pb-2 space-y-1">
                    {sec.children.map((child) => (
                      <a
                        key={child.name}
                        href={child.href}
                        className="block py-2 px-2 hover:bg-white/50 rounded hover:underline text-sm sm:text-base transition-colors"
                        onClick={closeMobileMenu}
                      >
                        {child.name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <a
                key={sec.name}
                href={sec.href}
                className="block py-2.5 px-2 hover:bg-white/50 rounded hover:underline text-sm sm:text-base capitalize transition-colors border-b border-gray-200/50 last:border-b-0"
                onClick={closeMobileMenu}
              >
                {sec.name}
              </a>
            )
          )}

          {/* Mobile Auth Section */}
          <div className="pt-4 mt-4 border-t-2 border-gray-300/50">
            {authLoading ? (
              <div className="flex items-center justify-center w-full py-4">
                <Loader2 className="animate-spin h-5 w-5" />
              </div>
            ) : user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-2 py-2 mb-3">
                  <Image
                    src={avatarUrl}
                    alt="Profile"
                    width={40}
                    height={40}
                    className="rounded-full w-10 h-10 object-cover"
                  />
                  <span className="text-sm sm:text-base font-medium">
                    {databaseUser?.name || user?.user_metadata?.firstName || "User"}
                  </span>
                </div>
                {(databaseUser?.memberType === 'ADMIN' || user?.user_metadata?.memberType === 'ADMIN') && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm sm:text-base"
                    onClick={() => {
                      router.push('/admin')
                      closeMobileMenu()
                    }}
                  >
                    Admin Dashboard
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm sm:text-base"
                  onClick={() => {
                    router.push('/dashboard#overview')
                    closeMobileMenu()
                  }}
                >
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm sm:text-base text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleLogout}
                  disabled={logoutLoading}
                >
                  {logoutLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Logging out...
                    </div>
                  ) : (
                    "Logout"
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  variant="ghost"
                  className="flex-1 text-sm sm:text-base"
                  onClick={() => {
                    router.push('/login')
                    closeMobileMenu()
                  }}
                >
                  Login
                </Button>
                <Button
                  className="flex-1 text-white bg-orange-500 hover:bg-orange-600 transition-colors duration-200 text-sm sm:text-base"
                  onClick={() => {
                    router.push('/sign-up')
                    closeMobileMenu()
                  }}
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}