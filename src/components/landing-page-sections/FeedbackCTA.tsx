// src/components/landing-page-sections/FeedbackCTA.tsx
'use client'

import { Star } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function FeedbackCTA() {
  return (
    <div className="mt-12 bg-gray-100 p-8 rounded-2xl max-w-lg mx-auto text-center">
      <div className="flex justify-center space-x-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-6 h-6 text-yellow-400" />
        ))}
      </div>
      <h3 className="text-2xl font-serif mb-2">Loved your time here?</h3>
      <p className="text-gray-600 mb-6">
        If you enjoyed working with us, please leave a 5-star review!
      </p>
      <Link href="https://www.google.com/search?sca_esv=6e430c099377becc&sxsrf=AE3TifMArXba-2tTAqzgepKVCWKO0nxlKQ:1751697082160&kgmid=/g/11xkz9g25_&q=My+Productive+Space&shndl=30&shem=fdl1p,lcuae,lspt19,uaasie&source=sh/x/loc/uni/m1/1&kgs=dff62f9f4f2aac23&sei=8MZoaM3dE_yX4-EPx7-T2QM#lrd=0x31da17e60c43cc53:0x5edc6bc187ef02f0,3,,,,">
        <Button className="px-8 py-4 bg-[#A52A2A] hover:bg-orange-500 text-white rounded-lg transition-colors duration-200">
          Leave a Review
        </Button>
      </Link>
    </div>
  )
}
