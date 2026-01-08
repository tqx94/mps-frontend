// src/components/landing-page-sections/LocationsSection.tsx
'use client'

import Image from 'next/image'
import { Carousel } from '@/components/Carousel'; 
// Carousel wrapper around Radix or react-slick
import { Button } from '@/components/ui/button'
import { MapPin } from 'lucide-react'
import Link from 'next/link'


const locations = [
  {
        src: '/mock_img/zoneA.png',
        title: 'Kovan',
        desc: '15 seats in Total',
        items: [
        'Monitors have different types of cables, subjected to availability',
        '15 seats in total',
       
        ],
    }
]

export default function LocationsSection() {
  return (
    <section id="Locations" className="py-12">
      <div className="container mx-auto">
      <h2 className="text-4xl font-serif text-center">Locations & Seat Layout</h2>
   
        <Carousel
          settings={{
            slidesToShow: 1,    // exactly 1 slide visible
            slidesToScroll: 1,  // scroll 1 at a time
            arrows: true,
            dots: true,
            infinite: false,
          }}
        >
          {locations.map((loc, i) => {
            // dynamic google-maps search URL
            const mapLink = `https://maps.app.goo.gl/5Vjx5BBzuFLpWbCG8`
            return (
            <div
              key={i}
              className="w-full flex flex-col md:flex-row items-start justify-between gap-6 p-6 bg-gray-50 rounded-lg"
            >
              <Image
                src={loc.src}
                alt={loc.title}
                width={600}
                height={200}
                className="rounded-lg flex-shrink-0"
              />
              <div>
                <h3 className="text-2xl font-semibold">
                  Current Location: {loc.title}
                </h3>
                {/* <p className="mt-2 text-gray-700">{loc.desc}</p> */}
                <ul className="mt-2 list-disc list-inside text-gray-700 space-y-1">
                  {loc.items.map((it, j) => (
                    <li key={j}>{it}</li>
                  ))}
                </ul>
                <div className="mt-6">
                    <Link href={mapLink} target="_blank" rel="noopener">
                      <Button
                        className="
                          inline-flex items-center 
                          px-6 py-3 
                          bg-[#A52A2A] hover:bg-orange-500 
                          text-white 
                          rounded-full 
                          shadow-md 
                          transform hover:-translate-y-0.5 
                          transition-all duration-200
                        "
                      >
                        <MapPin className="w-5 h-5 mr-2" />
                        Find us on Maps
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </Carousel>
      </div>
    </section>
  )
}
