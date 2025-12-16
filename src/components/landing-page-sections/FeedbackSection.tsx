// src/components/landing-page-sections/FeedbackSection.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import FeedbackCTA from '@/components/landing-page-sections/FeedbackCTA'


const testimonials = [
  {
    avatar: '/mock_img/john.png',
    name: 'John Tan',
    role: 'Freelance UX Designer',
    feedback: 'Whether it’s investor calls or team sprints  this is the place...',
  },
  {
    avatar: '/mock_img/jake.png',
    name: 'Jake Lee',
    role: 'Remote Journalist',
    feedback: 'I’ve tried multiple co-working spaces and this one is the best...',
  },
  {
    avatar: '/mock_img/joanne.png',
    name: 'Joanne Lim',
    role: '90 RP JC Student',
    feedback: 'Studying here helps me stay in the zone and also helps me stay focused...',
  },
]

export default function FeedbackSection() {
  return (
    <section id="Feedback" className="py-12">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-serif">Co-working Feedback</h2>
          <p className="mt-2 text-gray-600">Here some awesome feedback from our past co-workers</p>
         
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((u, i) => (
              <div key={i} className="p-6 bg-gray-50 rounded-lg text-left">
                <div className="flex items-center space-x-4">
                  <Image src={u.avatar} alt={u.name} width={48} height={48} className="rounded-full" />
                  <div>
                    <p className="text-lg font-medium">{u.name}</p>
                    <p className="text-sm text-gray-500">{u.role}</p>
                  </div>
                </div>
                <p className="mt-4 italic text-gray-700">“{u.feedback}”</p>
              </div>
            ))}
          </div>

           {/* Review prompt */}
        <FeedbackCTA />
        </div>
        


      </section>
  )
}
