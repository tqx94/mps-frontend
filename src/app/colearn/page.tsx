'use client'
// app/colearn/page.tsx
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import { ContactSection } from '@/components/landing-page-sections/ContactSection'
import { Tab } from '@headlessui/react'
import { Carousel } from '@/components/Carousel'
import { useRouter } from 'next/navigation'
import { usePackages } from '@/hooks/useNewPackages'
import { NewPackage } from '@/lib/services/packageService'
import { usePricing } from '@/hooks/usePricing'
import { FooterSection } from '@/components/landing-page-sections/FooterSection'

const rateHeaders = ['1 hr']

const promos = [
  {
    title: 'Spring Special: 20% Off',
    img: '/pricing_img/promo-spring.png',
    desc: 'Use code SPRING20 at checkout. Valid till 30 Apr.',
  },
]

const packages = [
  {
    title: 'Half-Day Productivity Boost',
    img: '/pricing_img/package-1.png',
    details: [
      '6 Half-Day Pass (6 hrs/pass)',
      '4 Complimentary Hours',
      'Valid 30 days from activation',
      'SGD 109 (UP 150) + SGD 5 for all outlets'
    ],
  },
  {
    title: 'Flexible Full-Day Focus',
    img: '/pricing_img/package-2.png',
    details: [
      '6 Full-Day Pass (12 hrs/pass)',
      '2 Half-Day Passes (6 hrs/pass)',
      'Valid 30 days from activation',
      'SGD 209 (UP 280) + SGD 5 for all outlets'
    ],
  },
]

const perks = [
  { src: '/mock_img/perk1.png', title: 'Teaching Command Center', subtitle: 'Smart boards, projectors & premium audio-visual setup' },
  { src: '/mock_img/perk2.png', title: 'Flexible Class Sizes', subtitle: 'Scale from 1-on-1 to group sessions effortlessly' },
  { src: '/mock_img/perk3.png', title: 'Professional Atmosphere', subtitle: 'Impress students & parents with premium facilities' },
  { src: '/mock_img/perk4.png', title: 'Zero Setup Hassle', subtitle: 'Walk in, teach, walk out - everything provided' },
  { src: '/mock_img/perk1.png', title: 'Prime Locations', subtitle: 'Convenient spots that save you & students travel time' },
  { src: '/mock_img/perk2.png', title: 'Pay-As-You-Go', subtitle: 'No long-term commitments or hidden fees' },
  { src: '/mock_img/perk1.png', title: 'Revenue Multiplier', subtitle: 'Teach more students simultaneously, earn more' },
  { src: '/mock_img/perk2.png', title: 'Educator Community', subtitle: 'Network with fellow tutors & share resources' },
  { src: '/mock_img/perk3.png', title: 'Brand Building Hub', subtitle: 'Professional space that elevates your reputation' },
  { src: '/mock_img/perk4.png', title: 'All-Inclusive Setup', subtitle: 'Furniture, tech & utilities - focus on teaching' },
  { src: '/mock_img/perk1.png', title: 'Booking Guarantee', subtitle: 'Reserved slots ensure your classes run smoothly' },
  { src: '/mock_img/perk2.png', title: 'Flexible Pricing', subtitle: 'Pay per session with no minimum commitments' },
]

export default function CoTutorPage() {
  const router = useRouter()
  const { packages, loading: packagesLoading, error: packagesError } = usePackages('TUTOR')
  const { tutorPricing, studentPricing, loading: pricingLoading } = usePricing('ALL')

  // Filter tutor packages
  const tutorPackages = packages

  // Generate rate rows based on backend pricing
  const getRateRows = () => {
    const rows = []
    
    if (studentPricing) {
      rows.push({ label: 'Student', values: [studentPricing.oneHourRate.toString()] })
    } else {
      rows.push({ label: 'Student', values: ['3'] })
    }
    
    if (tutorPricing) {
      rows.push({ label: 'Tutor', values: [tutorPricing.oneHourRate.toString()] })
    } else {
      rows.push({ label: 'Tutor', values: ['5'] })
    }
    
    return rows
  }

  const rateRows = getRateRows()

  const handleBuyNow = (packageData: NewPackage) => {
    router.push(`/buy-pass?package=${encodeURIComponent(packageData.name)}&type=tutor&packageId=${packageData.id}`)
  }
  return (
    <>
      <Navbar />

      {/* Hero */}
      <div className="relative h-125">
        <Image src="/mock_img/hero-bg.png" alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-2xl text-center mx-[5%]">
            <p className="uppercase text-sm text-gray-500">People. Space. Vibes.</p>
            <h1 className="mt-2 text-3xl font-bold">Co-Learning</h1>
            <p className="mt-4 text-gray-700">
              Expand and scale your teaching capabilities in a modern, accessible environment.
              Classrooms come with spacious tables, a 55″ TV, and whiteboards. Printing services available.
            </p>
          </div>
        </div>
      </div>

      {/* Reasons Grid */}
      <main className="max-w-6xl mx-auto py-16 space-y-12">
       
        <section className="space-y-6">
                <h2 className="text-3xl font-bold text-center">Reasons to Teach at My Prodcutive Space</h2>
                <div className="mt-4">
                                    <Carousel>
                                        {perks.map((item, i) => (
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
                  <div className="text-center mt-10">
         



         
          </div>
                                </section>

        {/* Schedule */}
  

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
               
                         <Tab.Panels className="mt-8 px-[3%]">
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
                             ) : tutorPackages.length > 0 ? (
                               tutorPackages.map((pkg) => (
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
                                       className="mt-4 px-4 py-2 bg-gray-800 text-white rounded transition-colors duration-200 hover:bg-orange-500"
                                     >
                                       Buy Now
                                     </button>
                                   </div>
                                 </div>
                               ))
                             ) : (
                               <div className="text-center py-12 col-span-2">
                                 <p className="text-gray-500 text-lg">No tutor packages available at the moment.</p>
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
