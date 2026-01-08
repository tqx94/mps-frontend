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
          <h1 className='font-semibold text-3xl'>Terms &amp; Conditions</h1>
          <br/>
          <h1 className='underline'>Terms &amp; Conditions</h1>
          <p>
            My Productive Space reserves the rights to amend the terms and conditions at any time without notification. 
            By booking with My Productive Space, the client has agreed to abide by the terms and conditions listed.
          </p>
          <p>
            All bookings are final and may not be amended.
          </p>
          <p>
            By reserving a space with My Productive Space, you agree to our collection, use and disclosure of your personal data 
            in accordance with the Singapore Personal Data Protection Act (PDPA). We collect information such as your name, contact 
            details, address and booking history to process your orders, provide customer service and improve our offerings. With your 
            consent, we may send you updates on promotions, product launches, or special events. You can opt out of these marketing 
            communications anytime. Your data is stored securely and only accessed by authorised personnel or trusted service providers 
            necessary to fulfil your bookings. We respect your rights to access, correct or withdraw consent over your personal data. 
            For any queries or requests, you may contact us at <a href="mailto:myproductivespacecontact@gmail.com" className="text-blue-600 underline">myproductivespacecontact@gmail.com</a>. 
            We do not sell your data to third parties and retain personal data only as long as necessary for business or legal purposes.
          </p>
<br/>
<h2 className='underline'>1. Booking Policy</h2>
<br/>
          <h2 className='mb-2'>1. Booking Policy</h2>
      
          <p>
            All bookings must be made through our online portal. Teaching activities must be booked under the "Tutor" tier; 
            failure to do so will be deemed a policy violation. We reserve the right to blacklist for future bookings.
          </p>
          <br/>
          <h2 className='mb-2'>2. Rescheduling, Cancellation &amp; Refunds</h2>

          <p>
            Cancellations or rescheduling has to be made more than 5 hours in advance. Bookings can only be rescheduled once 
            and its subjected to availability. Refunds are provided in the form of store credits. Within 5 hours, bookings are 
            non-refundable but may be rescheduled once, subject to availability.
          </p>
<br/>
          <h2 className='mb-2'>3. Conduct</h2>
          <p>
            You are responsible for the behaviour of yourself and your guests. Any damage to facilities will
            incur repair or replacement charges.
          </p>
<br/>
          <h2 className='mb-2'>4. Liability</h2>
          <p>
            MyProductiveSpace is not liable for personal injury or loss of personal property. Use of our
            premises is at your own risk.
          </p>
<br/>
          <h2 className='mb-1 underline'>Payment</h2>
          <p>
            My Productive Space currently provides 2 payment methods: Credit Card (HitPay) and PayNow (HitPay). All payment are 
            subjected to transaction fees listed on the payment page. The booking is only considered confirmed once payment is made. 
            Kindly ensure that all required information is submitted correctly to prevent any changes in the bookings. Seats will be 
            automatically released and cancelled if payment is not received or updated within the given timeframe. Please note that 
            cancellation and store credits refunds is permitted within a 5 hour notice period.
          </p>
          <p>
            Store credits only are valid for 1 month for the date of issue, Cash refunds or conversion of credits to cash are strictly not allowed.
          </p>
<br/>
          <h2 className='mb-1 underline'>6. Credits and Promos</h2>
          <p>
            Credits, Promos, Packages are not stackable.
          </p>
          <p>
            My Productive Space reserves the right to nullify any discounts if discount/packages were discovered to be misused.
          </p>
<br/>
          <h2 className=" mb-1 underline">Contacting</h2>
          <p className="">
            We require 1-2 working days to attend to emails. Kindly refrain from sending multiple emails as our email works in a 
            ticketing system if multiple emails are sent, the initial email from the same sender will get pushed back, hence resulting 
            in possible delay in replies. You may whatsapp us for faster replies.
          </p>
          <br/>
          <p className="">
            My Productive Space will love to serve you with courtesy and respect, and we will appreciate if you treat our staffs in the same manner.
          </p>
          <p className="">
            Thank you for choosing to work productively with My Productive Space :)
          </p>
        </section>

        {/* Privacy Policy */}
        {/* <section id="privacy" className="prose prose-lg">
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
        </section> */}
      </main>

      <ContactSection />
    </>
  )
}
