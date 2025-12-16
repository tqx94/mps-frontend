'use client'

import Image from 'next/image'

const items = [
  {
    src: '/mock_img/member-premium.png',
    title: 'Co-working Space',
    desc:
      'A noise-free, productive environment suited to your habits—love where you work!',
    ref: {
      text: 'Flexible workspaces can unlock value for both your employees and your bottom line.',
      href: '/cowork',
    },
    ref1: {
      text: 'Pricing & Booking info',
      href: '/pricing',
    },
    ref2: {
      text: 'Find out about our Offer Packages',
      href: '/cowork#packages',
    },
  },

  {
    src: '/mock_img/Students.jpeg',
    title: 'Co-study',
    desc:
      'A space with good vibes for effective studying. Be motivated with friends and push through the rigour.',
    ref: {
      text: 'Learn more about CoStudy',
      href: '/costudy',
    },
    ref1: {
      text: 'Pricing & Booking info',
      href: '/pricing',
    },
    ref2: {
      text: 'Find out about our Offer Packages',
      href: '/costudy#packages',
    },
  },
  {
    src: '/mock_img/tutor.jpg',
    title: 'Co-learn',
    desc:
      'A dedicated area for one-on-one tutoring. Commercial teaching must be booked under our Tutor tier.',
    ref: {
      text: 'Read our CoTeach policy',
      href: '/colearn',
    },
    ref1: {
      text: 'Pricing & Booking info',
      href: '/pricing',
    },
    ref2: {
      text: 'Find out about our Offer Packages',
      href: '/colearn#packages',
    },
  },
]

export default function WhatIsItUsedForSection() {
  return (
    <section id="WhyUs" className="py-1 bg-gray-50 text-gray-900">
  <div className="container mx-auto text-center">
    <h2 className="text-4xl font-serif">What Is It Used For</h2>
    <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
      A tranquil, flexible and hassle-free workspace—tailored to your needs from morning to night.
    </p>

    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
      {items.map((item, i) => (
        <div key={i} className="p-6 bg-white rounded-lg shadow">
          <Image
            src={item.src}
            alt={item.title}
            width={360}
            height={240}
            className="rounded-md object-cover"
          />
          <h4 className="mt-4 font-semibold text-xl text-gray-900">
            {item.title}
          </h4>
          <p className="mt-2 text-gray-700">{item.desc}</p>
          <p className="mt-3 text-sm text-gray-500">
            <a
              href={item.ref.href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-700"
            >
              {item.ref.text}
            </a>
          </p>
          <p className="mt-3 text-sm text-gray-500">
            <a
              href={item.ref1.href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-700"
            >
              {item.ref1.text}
            </a>
          </p>
          <p className="mt-3 text-sm text-gray-500">
            <a
              href={item.ref2.href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-700"
            >
              {item.ref2.text}
            </a>
          </p>
        </div>

      ))}
    </div>
  </div>
</section>
  )
}
