'use client'
// app/costudy/page.tsx

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import { Tab } from '@headlessui/react'
import { Carousel } from '@/components/Carousel'

import { ContactSection } from '@/components/landing-page-sections/ContactSection'
import { useRouter } from 'next/navigation'
import { usePackages } from '@/hooks/useNewPackages'
import { NewPackage } from '@/lib/services/packageService'
import { useAuth } from '@/hooks/useAuth'
import { getEffectiveMemberType } from '@/lib/userProfileService'
import { usePricing } from '@/hooks/usePricing'
import { FooterSection } from '@/components/landing-page-sections/FooterSection'

// Define the user type for API response
interface ApiUser {
  id: string
  email: string
  firstName: string
  lastName: string
  memberType: 'STUDENT' | 'MEMBER' | 'TUTOR'
  contactNumber: string
  studentVerificationStatus: 'NA' | 'PENDING' | 'VERIFIED' | 'REJECTED'
  studentVerificationImageUrl?: string
  studentVerificationDate?: string
  studentRejectionReason?: string
  createdAt: string
  updatedAt: string
}
const rateHeaders = ['1 hr']

const promos = [
  {
    title: 'Spring Special: 20% Off',
    img: '/pricing_img/promo-spring.png',
    desc: 'Use code SPRING20 at checkout. Valid till 30 Apr.',
  },
]

// const packages = [
//   {
//     title: 'Half-Day Productivity Boost',
//     img: '/pricing_img/package-1.png',
//     details: [
//       '6 Half-Day Pass (6 hrs/pass)',
//       '4 Complimentary Hours',
//       'Valid 30 days from activation',
//       'SGD 109 (UP 150) + SGD 5 for all outlets'
//     ],
//   },
//   {
//     title: 'Flexible Full-Day Focus',
//     img: '/pricing_img/package-2.png',
//     details: [
//       '6 Full-Day Pass (12 hrs/pass)',
//       '2 Half-Day Passes (6 hrs/pass)',
//       'Valid 30 days from activation',
//       'SGD 209 (UP 280) + SGD 5 for all outlets'
//     ],
//   },
// ]

export default function CoLearningPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { packages, loading: packagesLoading, error: packagesError } = usePackages('STUDENT')
  const { studentPricing, loading: pricingLoading } = usePricing('ALL')
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null)
  const [userLoading, setUserLoading] = useState(true)

  // Filter student packages
  const studentPackages = packages

  // Generate rate rows based on backend pricing
  const getRateRows = () => {
    if (studentPricing) {
      return [
        { label: 'Student', values: [studentPricing.oneHourRate.toString()] },
      ]
    }
    return [
      { label: 'Student', values: ['3'] },
    ]
  }

  const rateRows = getRateRows()

  // Fetch fresh user data from API
  const fetchCurrentUser = async () => {
    if (!user?.id) {
      setUserLoading(false)
      return
    }

    try {
      setUserLoading(true)
      const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'https://productive-space-backend.vercel.app/api'
      const response = await fetch(`${API_BASE_URL}/user/${user.id}`)
      
      if (response.ok) {
        const userData = await response.json()
        if (userData.success && userData.user) {
          console.log('Fresh user data from API:', userData.user)
          setCurrentUser(userData.user as ApiUser)
        }
      } else {
        console.error('Failed to fetch user data:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setUserLoading(false)
    }
  }

  // Fetch user data on component mount
  useEffect(() => {
    fetchCurrentUser()
  }, [user?.id])

 
  const canPurchasePackage = () => {
    if (!currentUser) return false // No user data
    if (!user) return false // Not logged in
    
    // Use effective member type - only verified students can purchase
    const effectiveMemberType = getEffectiveMemberType(
      currentUser.memberType || 'MEMBER', 
      currentUser.studentVerificationStatus
    )
    return effectiveMemberType === 'STUDENT'
  }

  const isLoggedIn = !!user
  const effectiveMemberType = currentUser 
    ? getEffectiveMemberType(
        currentUser.memberType || 'MEMBER',
        currentUser.studentVerificationStatus
      )
    : 'MEMBER'

  const isStudent = effectiveMemberType === 'STUDENT'
  const canPurchase = canPurchasePackage()

  const handleRefreshUser = async () => {
    console.log('Manually refreshing user data from API...')
    await fetchCurrentUser()
  }

  const handleBuyNow = (packageData: NewPackage) => {
    if (!isLoggedIn) {
      // Redirect to login if not logged in
      router.push('/login?next=/costudy')
      return
    }
    if (!isStudent) {
      // Show alert if not a student
      alert('Student packages are only available to verified students. Please verify your student status first.')
      return
    }
    router.push(`/buy-pass?package=${encodeURIComponent(packageData.name)}&type=student&packageId=${packageData.id}`)
  }

  const reasons = [
    { src: '/mock_img/perk1.png', title: 'Focus Zone Vibes', subtitle: 'Noise-controlled areas for deep concentration' },
    { src: '/mock_img/perk2.png', title: 'Study Buddy Network', subtitle: 'Connect with motivated peers and study groups' },
    { src: '/mock_img/perk3.png', title: 'Brain Fuel Station', subtitle: 'Free coffee, snacks & energy drinks' },
    { src: '/mock_img/perk4.png', title: 'Exam Prep Paradise', subtitle: 'Whiteboards, projectors & group study rooms' },
    { src: '/mock_img/perk1.png', title: '24/7 Access', subtitle: 'Study whenever inspiration strikes' },
    { src: '/mock_img/perk2.png', title: 'Affordable Rates', subtitle: 'Flexible pricing for students on a budget' },
    
  ]

  return (
    <>
      <Navbar />

      {/* Hero */}
      <div className="relative h-125">
        <Image src="/mock_img/hero-bg.png" alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-2xl text-center mx-[5%]">
            <p className="uppercase text-sm text-gray-500">People. Space. Vibes.</p>
            <h1 className="mt-2 text-3xl font-bold">Costudying</h1>
            <p className="mt-4 text-gray-700">
              A space with a conducive environment and good vibes for effective studying.
              Be motivated with friends and push through the rigour.
            </p>
            <p className="mt-2 text-gray-600 text-sm">
              Must register as a student member to unlock these discounts.
            </p>
        
          </div>
        </div>
      </div>

     

      {/* Tabs */}
      <main className="max-w-7xl mx-auto py-20 px-4 space-y-12">
    
        <section className="space-y-6">
                <h2 className="text-3xl font-bold text-center">Reasons to Co-Study at Spatial</h2>
                <div className="mt-4">
                                    <Carousel>
                                        {reasons.map((item, i) => (
                                            <div key={i} className="relative">
                                                <Image src={item.src} alt={item.title} width={400} height={300} className="rounded-lg" />
                                                <div className="absolute bottom-4 left-4 text-white">
                                                    <h4 className="font-semibold text-lg">{item.title}</h4>
                                                    <p>{item.subtitle}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </Carousel>
                                </div>
                                <div className="text-center">
                    
                  </div>
                
                                </section>
        {/* Tabs */}
                       <Tab.Group>
                         <Tab.List className="flex justify-center space-x-4">
                           {['Rates', 'Promos', 'Packages'].map((tab) => (
                             <Tab
                               key={tab}
                               className={({ selected }) =>
                                 `px-4 py-2 rounded-md font-medium ${
                                   selected ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700'
                                 }`
                               }
                             >
                               {tab}
                             </Tab>
                           ))}
                         </Tab.List>
               
                         <Tab.Panels className="mt-8">
                           {/* Rates Panel */}
                           <Tab.Panel>
                             <div className="overflow-x-auto">
                               <table className="w-full text-center border-collapse">
                                 <thead>
                                   <tr className="bg-gray-100">
                                     <th className="p-3 font-semibold text-left">Tier</th>
                                     {rateHeaders.map((h) => (
                                       <th key={h} className="p-3 font-semibold">{h}</th>
                                     ))}
                                   </tr>
                                 </thead>
                                 <tbody>
                                   {rateRows.map(({ label, values }) => (
                                     <tr key={label} className="border-t">
                                       <td className="p-3 text-left font-medium">{label}</td>
                                       {values.map((v,i) => (
                                         <td key={i} className="p-3">{v}</td>
                                       ))}
                                     </tr>
                                   ))}
                                 </tbody>
                               </table>
               
                               {/* Scenario Example */}
                               {/* <div className="mt-6 p-4 bg-gray-50 rounded">
                                <p className="text-sm text-gray-500">
                                *Disclaimer: We go by an hourly fee...Full terms & conditions apply. Maximum xx pax in meeting rooms and 5 pax in collaborative spaces.
                                All xxx activities deemed xxxx.
                              </p>
                                 <h3 className="font-semibold">Example: Guest booking 1.5 hrs</h3>
                                 <p>
                                   1 hr @ 6 + 0.5 hr @ (6/2) = <strong>$9</strong>
                                 </p>
                               </div> */}
                             </div>
                           </Tab.Panel>
               
                           {/* Promos Panel */}
                           <Tab.Panel className="space-y-6">
                             {promos.map((p) => (
                               <div key={p.title} className="flex flex-col md:flex-row bg-orange-50 rounded-lg overflow-hidden shadow">
                                 <div className="md:w-1/3 relative h-48 md:h-auto">
                                   <Image src={p.img} alt={p.title} fill className="object-cover" />
                                 </div>
                                 <div className="p-6 flex-1">
                                   <h4 className="text-2xl font-semibold">{p.title}</h4>
                                   <p className="mt-2 text-gray-700">{p.desc}</p>
                                   <button className="mt-4 px-4 py-2 bg-orange-600 text-white rounded">
                                     Redeem Now
                                   </button>
                                 </div>
                               </div>
                             ))}
                           </Tab.Panel>
               
                           {/* Packages Panel */}
                           <Tab.Panel id="packages" className="grid gap-8 md:grid-cols-2">
                        
                            
                             {packagesLoading ? (
                               <div className="text-center py-12 col-span-2">
                                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                                 <p>Loading packages...</p>
                               </div>
                             ) : packagesError ? (
                               <div className="text-center py-12 col-span-2">
                                 <p className="text-red-500">Error loading packages: {packagesError}</p>
                                 <button 
                                   onClick={() => window.location.reload()} 
                                   className="mt-2 px-4 py-2 bg-orange-500 text-white rounded"
                                 >
                                   Try Again
                                 </button>
                               </div>
                             ) : studentPackages.length > 0 ? (
                               studentPackages.map((pkg) => (
                                 <div key={pkg.id} className="bg-gray-50 rounded-lg overflow-hidden shadow-lg">
                                   <div className="relative h-48">
                                     <Image 
                                       src={`/pricing_img/package-${pkg.packageType === 'HALF_DAY' ? '1' : '2'}.png`} 
                                       alt={pkg.name} 
                                       fill 
                                       className="object-cover" 
                                     />
                                   </div>
                                   <div className="p-6">
                                     <h4 className="text-xl font-semibold">{pkg.name}</h4>
                                     <ul className="mt-2 list-disc list-inside space-y-1 text-gray-700">
                                       <li>{pkg.description}</li>
                                       <li>{pkg.passCount} Counts (1 pass per booking)</li>
                                       <li>Package Type: {pkg.packageType.replace('_', ' ')}</li>
                                       <li>Valid {pkg.validityDays} days from activation</li>
                                       <li>SGD {pkg.price} {pkg.originalPrice && pkg.originalPrice > pkg.price && `(UP ${pkg.originalPrice})`} + SGD {pkg.outletFee} for all outlets</li>
                                     </ul>
                                     <button
                                       onClick={() => handleBuyNow(pkg)}
                                       disabled={isLoggedIn && !isStudent}
                                       className={`mt-4 px-4 py-2 rounded transition-colors duration-200 ${
                                         !isLoggedIn
                                           ? 'bg-gray-800 text-white hover:bg-orange-500' // Not logged in - clickable, redirects to login
                                           : isStudent
                                           ? 'bg-gray-800 text-white hover:bg-orange-500' // Logged in + Student - clickable
                                           : 'bg-gray-400 text-gray-200 cursor-not-allowed' // Logged in + Not Student - disabled
                                       }`}
                                     >
                                       {!isLoggedIn 
                                         ? 'Buy Now' 
                                         : isStudent 
                                         ? 'Buy Now' 
                                         : 'Students Only'
                                       }
                                     </button>
                                   </div>
                                 </div>
                               ))
                             ) : (
                               <div className="text-center py-12 col-span-2">
                                 <p className="text-gray-500 text-lg">No student packages available at the moment.</p>
                                 <p className="text-gray-400">Please check back later or contact us for custom arrangements.</p>
                               </div>
                             )}
                           </Tab.Panel>
                         </Tab.Panels>
                       </Tab.Group>
      </main>

      <ContactSection />
      <FooterSection/>
    </>
  )
}
