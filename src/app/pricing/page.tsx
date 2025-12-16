// app/pricing/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { ContactSection } from '@/components/landing-page-sections/ContactSection'
import { Tab } from '@headlessui/react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { usePackages } from '@/hooks/useNewPackages'
import { NewPackage } from '@/lib/services/packageService'
import { Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { getAllPricingForLocation } from '@/lib/pricingService'

const rateHeaders = ['1 hour', '>1 hour']
// Dynamic pricing will be loaded from database
const fallbackRateRows = [
  { label: 'Students', values: ['$4/hr*', '$3/hr*'] },
  { label: 'Members', values: ['$5/hr', '$4/hr'] },
  { label: 'Tutor', values: ['$6/hr', '$5/hr'] },
]

const studentNote = "*Student ID would be required as proof of verification during payment"

const promos = [
  {
    title: 'Spring Special: 20% Off',
    img: '/pricing_img/promo-spring.png',
    desc: 'Use code SPRING20 at checkout. Valid till 30 Apr.',
  },
]

export default function PricingPage() {
  const router = useRouter()
  const { packages, loading: packagesLoading, error: packagesError } = usePackages('MEMBER')
  const [rateRows, setRateRows] = useState(fallbackRateRows)
  const [pricingLoading, setPricingLoading] = useState(true)

  // Load dynamic pricing
  useEffect(() => {
    const loadPricing = async () => {
      try {
        const pricing = await getAllPricingForLocation('Kovan')
        setRateRows([
          { label: 'Students', values: [`$${pricing.student.oneHourRate}/hr*`, `$${pricing.student.overOneHourRate}/hr*`] },
          { label: 'Members', values: [`$${pricing.member.oneHourRate}/hr`, `$${pricing.member.overOneHourRate}/hr`] },
          { label: 'Tutor', values: [`$${pricing.tutor.oneHourRate}/hr`, `$${pricing.tutor.overOneHourRate}/hr`] },
        ])
      } catch (error) {
        console.error('Error loading pricing:', error)
        // Keep fallback pricing
      } finally {
        setPricingLoading(false)
      }
    }
    loadPricing()
  }, [])

  const handleBuyNow = (packageData: NewPackage) => {
    // Map targetRole to type parameter
    const typeMap: { [key: string]: string } = {
      'MEMBER': 'member',
      'STUDENT': 'student', 
      'TUTOR': 'tutor'
    }
    const typeParam = typeMap[packageData.targetRole] || 'member'
    router.push(`/buy-pass?package=${encodeURIComponent(packageData.name)}&type=${typeParam}&packageId=${packageData.id}`)
  }

  const handleBookWithPackage = (packageData: NewPackage) => {
    // Navigate to booking page with package parameter for auto-selection
    router.push(`/book-now?package=${encodeURIComponent(packageData.name)}`)
  }

  if (packagesLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading packages...</p>
          </div>
        </div>
      </>
    )
  }

  if (packagesError) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="max-w-md mx-auto">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Packages</AlertTitle>
              <AlertDescription>{packagesError}</AlertDescription>
            </Alert>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4 w-full"
            >
              Try Again
            </Button>
          </div>
        </div>
      </>
    )
  }


  return (
    <>
      <Navbar />

      <main className="max-w-7xl mx-auto py-20 px-4 space-y-12">
        {/* Header */}
        <div className="text-center">
          <p className="uppercase text-sm text-gray-500 tracking-wide">
            People. Space. Vibes.
          </p>
          <h1 className="mt-2 text-4xl font-bold">Workspace Solutions</h1>
          <p className="mt-2 text-gray-700 max-w-2xl mx-auto">
            Find the perfect workspace solution tailored to your needs—whether you are a guest, member,
            student, or tutor, we have got you covered.
          </p>
        </div>

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
                
                <div className="mt-4 text-sm text-gray-600 text-center">
                  <p>{studentNote}</p>
                </div>

                {/* Scenario Example */}
                <div className="mt-6 p-4 bg-gray-50 rounded">
                  <h3 className="font-semibold">Example: Student booking 2 hrs</h3>
                  <p>
                    2 hrs @ $3/hr = <strong>$6</strong>
                  </p>
                </div>
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
            <Tab.Panel className="grid gap-8 md:grid-cols-2">
              {packages.length > 0 ? (
                packages.map((pkg) => (
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
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => handleBuyNow(pkg)}
                          className="flex-1 px-4 py-2 bg-gray-800 text-white rounded transition-colors duration-200 hover:bg-orange-500"
                        >
                          Buy Package
                        </button>
                        <button
                          onClick={() => handleBookWithPackage(pkg)}
                          className="flex-1 px-4 py-2 bg-orange-500 text-white rounded transition-colors duration-200 hover:bg-orange-600"
                          title="Book now with this package (you must own it first)"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 col-span-2">
                  <p className="text-gray-500 text-lg">No packages available at the moment.</p>
                  <p className="text-gray-400">Please check back later.</p>
                </div>
              )}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </main>

      <ContactSection />
    </>
  )
}

