// src/components/landing-page-sections/FAQSection.tsx
'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'

import { MapPin } from 'lucide-react'

const faqs: { question: string, answer: React.ReactNode }[] = [
  {
    question: 'What amenities are included?',
    answer: `Every desk comes with ultra-fast 1 Gbps Wi-Fi, unlimited premium coffee & tea, access to our phone booths,
             standing desks, ergonomic chairs, and printing/scanning services.  Need a whiteboard?  We’ve got you covered!`,
  },
  {
    question: 'Can I use the space on weekends?',
    answer: `Absolutely!  Our doors are open 7 days a week from 7 am to 10 pm.  Weekend slots tend to fill up fast,
             so we recommend booking in advance—just like any weekday booking.`,
  },
  {
    question: 'How do I book meeting rooms?',
    answer: `Head over to the “Book Now” tab, choose the “Meeting Room” option and select your preferred time slot.
             You can reserve rooms for as little as 30 minutes, up to 4 hours at a time.  Need catering?  Let us know in advance!`,
  },
  {
    question: 'Are there any events?',
    answer: `Yes!  We host weekly “Coffee & Code” hack nights, monthly guest-speaker talks, and quarterly networking mixers.
             Check our Events calendar or subscribe to our newsletter so you never miss out.`,
  },
  {
    question: 'Can I bring guests?',
    answer: `Of course—every member tier comes with two complimentary guest packages per month.  Guests get full
             access to all amenities but must be accompanied by a member at all times.`,
  },
  {
    question: 'Is parking available?',
    answer: `We offer secure, reserved parking for $5 per visit in the building’s basement garage.  Street parking
             is free on weekends, and there’s also a bike rack out front if you prefer two wheels!`,
  },
  {
        question: 'Where can I find your shop physically?',
        answer: (
          <div className="flex items-start space-x-2">
            <MapPin className="w-4 h-4 text-red-500 mt-1" />
            <div>
              We’re located at 123 Productivity Lane, Singapore 567890. View us on <Link
                href="https://g.co/kgs/oZ7c1hJ"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Google Maps
              </Link> or visit our <Link
              
                href="https://www.google.com/maps/place/My+Productive+Space/data=!4m2!3m1!1s0x0:0x5edc6bc187ef02f0?sa=X&ved=1t:2428&ictx=111"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Google Listing
              </Link>
            </div>
          </div>
        ),
      },
]

export default function FAQSection() {
  return (
    <section id="FAQ" className="py-12">
      <div className="px-6 md:px-12 lg:px-16 xl:px-20">
     
        <div className="container mx-auto flex flex-col md:flex-row gap-12">
          <div className="md:w-1/3 space-y-4">
            <h2 className="text-4xl font-serif">FAQ’S</h2>
            <p className="mt-2 text-gray-600">Answers to your most common questions</p>
            <div className="flex flex-col space-y-3 mt-6">
            <Link href="#ContactUs">
              <Button variant="outline" className="w-40 bg-[#A15630] hover:bg-orange-600 text-white hover:text-white transition-colors duration-200">
                Still have questions?
              </Button>
            </Link>
            
            </div>
            
           
          </div>
          <div className="md:w-2/3">
            <Accordion type="single" collapsible>
              {faqs.map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent className="text-gray-700">
                  {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
        </div>
      </section>
  )
}
