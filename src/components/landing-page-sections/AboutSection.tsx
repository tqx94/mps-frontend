// frontend/src/components/landing-page-sections/AboutSection.tsx
'use client'

import Image from 'next/image'
import { Carousel } from '@/components/Carousel'
import LogoCloud from '@/components/logo-cloud'

const perks = [
    { src: '/mock_img/perk1.png', title: 'Best WiFi in Town', subtitle: '1 Gbps High-Speed Wi-Fi' },
    { src: '/mock_img/perk2.png', title: 'Tech Forward Space', subtitle: 'Charging Points & Monitors at Every Table' },
    { src: '/mock_img/perk3.png', title: 'Complimentary Snacks', subtitle: 'Best Facilities in the Region' },
    { src: '/mock_img/perk4.png', title: 'Clean Bathrooms', subtitle: 'Pods' },
]

export default function AboutSection() {
    return (

        <section id="About" className="py-8">
            <div className="container mx-auto text-center">
                <h2 className="text-4xl font-serif">About us</h2>
                {/* 1) pain-points slider Logo-Cloud Slider */}
                <div className="mt-2">
                    <LogoCloud />
                </div>

                {/* 4) sub-title */}
                <h3 className="mt-6 text-2xl font-semibold">So what do we offer?</h3>
                {/* <h3 className="mt-6 text-2xl font-semibold">So what makes us different?</h3> */}

                {/* 2) & 3) description + perks carousel */}
                <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
                    Step into our co-working sanctuary – 
                    where ambition ignites and creativity flourishes.
                     With top-notch amenities and a vibrant community, 
                     fuel your drive and feed your imagination.
                </p>
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
            </div>
        </section>
    )
}
