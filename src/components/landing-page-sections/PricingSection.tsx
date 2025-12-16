// src/components/landing-page-sections/PricingSection.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Carousel } from '@/components/Carousel'

const plans = [
    { src: '/mock_img/guest-regular.png', title: 'Guest', rate: '$7/hr', desc: 'An open vibrant co-working ...' },
    { src: '/mock_img/member-premium.png', title: 'Member', rate: '$6/hr', desc: 'Comfortable premium membership ...' },
    { src: '/mock_img/Students.jpeg', title: 'Student', rate: '$4.50/hr', desc: 'A peaceful zone ...' },
    { src: '/mock_img/tutor.jpg', title: 'Tutors', rate: '$6/pax/hr', desc: 'A private space ...' },
            
]

export default function PricingSection() {
  return (
    <section id="Pricing" className="py-12">
    <div className="container mx-auto text-center">
        <h2 className="text-4xl font-serif">Rates/Price</h2>
        <p className="mt-2 text-gray-600">
        Most popular spaces for our co-workers & students.
        </p>
        <p className="mt-2 text-gray-600">
                For bulk bookings, corporate enquiries, or collaborations, <a 
                href="#ContactUs" 
                className="text-orange-500 font-medium hover:underline"
            >
                contact us now
            </a> via our 24/7 Contact Form.
            </p>

        <div className="mt-8">
        <Carousel
            settings={{
            dots: true,
            arrows: true,
            infinite: false,
            speed: 500,
            slidesToShow: 3,
            slidesToScroll: 1,
            responsive: [
                {
                breakpoint: 1024,
                settings: { slidesToShow: 3, slidesToScroll: 1 },
                },
                {
                breakpoint: 768,
                settings: { slidesToShow: 2, slidesToScroll: 1 },
                },
                {
                breakpoint: 480,
                settings: { slidesToShow: 1, slidesToScroll: 1 },
                },
            ],
            }}
        >
            {plans.map((item, i) => (
            <div key={i} className="p-6 bg-gray-50 rounded-lg text-left">
                <Image
                src={item.src}
                alt={item.title}
                width={360}
                height={200}
                className="rounded-md"
                />
                <h4 className="mt-4 font-semibold text-xl">{item.title}</h4>
                <p className="mt-2 text-gray-700">{item.desc}</p>
                <div className="mt-4 flex items-center justify-between">
                <span className="font-medium text-orange-500">From {item.rate}</span>
                <Link href="/pricing">
                    <Button className="
                      px-8 py-4 
                      bg-[#A52A2A] hover:bg-orange-500 
                      text-white 
                      rounded-lg 
                      transition-colors duration-200
                    ">
                        Pricing for {item.title}
                    </Button>
                </Link>
                </div>
            </div>
            ))}
        </Carousel>
        </div>
    </div>
    </section>
  )
}
{/* Section 5: Rates & Price
      <section id="Pricing">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-serif">Rates/Price</h2>
          <p className="mt-2 text-gray-600">Most popular spaces for our co-workers & students.
Check out our special offer and discounts.</p>
          <div className="mt-8">
            <Carousel>
              {[
                { src: '/mock_img/Students.jpeg', title: 'Student (Quiet Room)', rate: '$4.50/hr', desc: 'A peaceful zone ...' },
                { src: '/mock_img/tutor.jpg', title: 'Tutor Room/Table', rate: '$6/pax/hr', desc: 'A private space ...' },
                { src: '/mock_img/guest-regular.png', title: 'Guest Regular', rate: '$7/hr', desc: 'An open vibrant co-working ...' },
                { src: '/mock_img/member-premium.png', title: 'Member Premium', rate: '$6/hr', desc: 'An open vibrant co-working ...' },
              ].map((item, i) => (
                <div key={i} className="p-6 bg-gray-50 rounded-lg text-left">
                  <Image src={item.src} alt={item.title} width={360} height={200} className="rounded-md" />
                  <h4 className="mt-4 font-semibold text-xl">{item.title}</h4>
                  <p className="mt-2 text-gray-700">{item.desc}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-medium text-orange-500">From {item.rate}</span>
                    <Button className="bg-orange-500 text-white">Book Now</Button>
                  </div>
                </div>
              ))}
            </Carousel>
          </div>
        </div>
      </section> */}