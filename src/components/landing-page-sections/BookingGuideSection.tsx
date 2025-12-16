// src/components/landing-page-sections/BookingGuideSection.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const steps = [
  {
    src: '/mock_img/step1.jpg',
    title: 'Step 1: Choose Your Zone',
    desc: 'Select the location or seating zone...',
    est: '~2min',
  },
  {
    src: '/mock_img/step2.png',
    title: 'Step 2: Select Time Slot',
    desc: 'Pick your preferred date and time...',
    est: '~1min',
  },
  {
    src: '/mock_img/step3.png',
    title: 'Step 3: Confirm & Pay',
    desc: 'Click Book Now, confirm your slot...',
    est: '~2min',
  },
]

export default function BookingGuideSection() {
  return (
    <section id="BookingGuide">
      <div className="container mx-auto text-center">
        <h2 className="text-4xl font-serif">How to book in under than 5min!</h2>
        <p className="mt-2 text-gray-600">Our environment is distraction-free, safe, and community-driven. Work solo or together — it's your space, your pace.</p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="p-6 bg-gray-50 rounded-lg text-left">
              <Image src={step.src} alt={step.title} width={360} height={200} className="rounded-md" />
              <h4 className="mt-4 font-semibold text-xl">{step.title}</h4>
              <p className="mt-2 text-gray-700">{step.desc}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-bold text-orange-500 text-lg md:text-xl">Est. {step.est}</span>
                
              </div>
            </div>
          ))}

        </div>
        {/* main call-to-action */}
        <div className="mt-10 flex justify-center">
        <Link href="/pricing" scroll={false}>
        <Button
          className="
            px-10         /* left/right padding */
            py-6          /* top/bottom padding */
            text-xl md:text-2xl  /* larger text on desktop */
            min-w-[220px] /* ensure a minimum width */
            text-white 
            rounded-lg shadow-md 
            bg-orange-500
            transition-colors duration-300
          "
          onClick={() => {/* your booking handler */}}
        >
          Get Pricing & Book it Now
        </Button>
        </Link>
      </div>
      </div>
    </section>
  )
}
