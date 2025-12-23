'use client'

import BookingForm from '@/components/landing-page-sections/BookingForm'
import Navbar from '@/components/Navbar'
import LatestAnnouncementSection from '@/components/landing-page-sections/LatestAnnouncementSection'
import AboutSection from '@/components/landing-page-sections/AboutSection'
import WhatIsItUsedForSection from '@/components/landing-page-sections/WhatIsItUsedFor'
import BookingGuideSection from '@/components/landing-page-sections/BookingGuideSection'
import LocationsSection from "@/components/landing-page-sections/LocationsSection";
import PricingSection from '@/components/landing-page-sections/PricingSection';
import FeedbackSection from '@/components/landing-page-sections/FeedbackSection';
import FAQSection from '@/components/landing-page-sections/FAQSection'


import { ContactSection } from '@/components/landing-page-sections/ContactSection'
import { FooterSection } from '@/components/landing-page-sections/FooterSection'
import OpenDoorExample from '@/components/OpenDoorExample'


export default function Home() {

  return (
      <>

    <main className="space-y-4 md:space-y-24 overflow-x-hidden w-full max-w-full">
      {/* NavBar */}
      <Navbar />

      {/* Section 1: Quick Booking */}
      <BookingForm />

      {/* Section 2: Latest Announcements */}
      <LatestAnnouncementSection />

      {/* Section 3: About Us Carousel */}
      <AboutSection />

      {/* Section 4: What Is It Used For */}
      <WhatIsItUsedForSection />

      {/* Section 5: How to Book */}
      <BookingGuideSection />

      {/* Section 6: Locations */}
      <LocationsSection />

      {/* Section 7: Rates & Price */}
      <PricingSection />

      {/* Section 8: Feedback */}
      <FeedbackSection />


      {/* Section 9: FAQ */}
      <FAQSection />

      {/* Section 8: Contact & Footer */}
      <ContactSection />
      {/* <OpenDoorExample /> */}

    </main>
      <FooterSection />
    </>
  );
}
