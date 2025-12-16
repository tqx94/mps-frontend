// app/terms/page.tsx
'use client'

import Navbar from '@/components/Navbar'
import { ContactSection } from '@/components/landing-page-sections/ContactSection'

export default function LegalPage() {
  return (
    <>
      <Navbar />

      <main className="max-w-4xl mx-auto py-16 px-4 space-y-12">
        {/* Sub-Nav */}
        <nav className="flex justify-center space-x-6 border-b pb-4">
          <a href="#terms" className="text-gray-700 hover:underline">
            Terms &amp; Conditions
          </a>
          <a href="#privacy" className="text-gray-700 hover:underline">
            Privacy Policy
          </a>
        </nav>

        {/* Terms & Conditions */}
        <section id="terms" className="prose prose-lg">
          <h1>Terms &amp; Conditions</h1>
          <p>Welcome to MyProductiveSpace. By accessing or using our service, you agree to the following:</p>

          <h2>1. Booking Policy</h2>
          <ul>
            <li>All bookings must be made through our online portal.</li>
            <li>Teaching activities must be booked under the “Tutor” tier; failure to do so will be deemed a policy violation.</li>
            <li>Only one tuition session per timeslot is allowed.</li>
          </ul>

          <h2>2. Cancellation &amp; Refunds</h2>
          <p>
            Cancellations made more than 24 hours in advance receive a full refund. Within 24 hours, bookings
            are non-refundable but may be rescheduled once, subject to availability.
          </p>

          <h2>3. Conduct</h2>
          <p>
            You are responsible for the behaviour of yourself and your guests. Any damage to facilities will
            incur repair or replacement charges.
          </p>

          <h2>4. Liability</h2>
          <p>
            MyProductiveSpace is not liable for personal injury or loss of personal property. Use of our
            premises is at your own risk.
          </p>
        </section>

        {/* Privacy Policy */}
        <section id="privacy" className="prose prose-lg">
          <h1>Privacy Policy</h1>
          <p>Your privacy is important to us. This policy explains what data we collect and how we use it.</p>

          <h2>1. Information We Collect</h2>
          <ul>
            <li><strong>Personal Data:</strong> Name, email, phone number—collected when you create an account or book a slot.</li>
            <li><strong>Usage Data:</strong> Pages visited, booking history, and device information via cookies.</li>
          </ul>

          <h2>2. How We Use Your Data</h2>
          <ul>
            <li>To process and confirm bookings.</li>
            <li>To send booking reminders and promotional offers (you can opt out at any time).</li>
            <li>To improve our services through usage analytics.</li>
          </ul>

          <h2>3. Data Sharing &amp; Security</h2>
          <p>
            We do not sell your data. We may share information with trusted service providers (e.g. payment
            processors) under strict confidentiality. All personal data is stored securely and encrypted at rest.
          </p>

          <h2>4. Cookies</h2>
          <p>
            We use cookies to maintain your session, remember preferences, and gather analytics. You can
            disable cookies in your browser but some features may not work properly.
          </p>

          <h2>5. Your Rights</h2>
          <p>
            You have the right to access, correct, or delete your personal data. For any privacy requests,
            please email us at <a href="mailto:privacy@myproductivespace.com" className="text-blue-600">privacy@myproductivespace.com</a>.
          </p>
        </section>
      </main>

      <ContactSection />
    </>
  )
}
