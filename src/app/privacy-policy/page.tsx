// app/privacy-policy/page.tsx
'use client'

import Navbar from '@/components/Navbar'
import { ContactSection } from '@/components/landing-page-sections/ContactSection'
import { FooterSection } from '@/components/landing-page-sections/FooterSection'
import { Shield, Lock, Cookie, Mail, CheckCircle } from 'lucide-react'

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-20 md:py-28 mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
            <Shield className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-semibold text-white">Legal Information</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Privacy <span className="text-orange-500">Policy</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-300 leading-relaxed">
            Your privacy is important to us. Learn how we collect and use your data.
          </p>
        </div>
      </div>

      <main className="bg-gray-50 py-16 md:py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Privacy Policy */}
          <section className="mb-0">
            <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-50 to-pink-50 border-b-2 border-orange-200 p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">Privacy Policy</h2>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  Your privacy is important to us. This policy explains what data we collect and how we use it.
                </p>
              </div>

              {/* Content */}
              <div className="p-8 space-y-8">
                {/* 1. Information We Collect */}
                <div>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <Lock className="w-4 h-4 text-orange-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">1. Information We Collect</h3>
                  </div>
                  <div className="space-y-4 ml-11">
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <p className="font-semibold text-gray-900 mb-2">Personal Data:</p>
                      <p className="text-gray-700">Name, email, phone number—collected when you create an account or book a slot.</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="font-semibold text-gray-900 mb-2">Usage Data:</p>
                      <p className="text-gray-700">Pages visited, booking history, and device information via cookies.</p>
                    </div>
                  </div>
                </div>

                {/* 2. How We Use Your Data */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">2. How We Use Your Data</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">To process and confirm bookings.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">To send booking reminders and promotional offers (you can opt out at any time).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">To improve our services through usage analytics.</span>
                    </li>
                  </ul>
                </div>

                {/* 3. Data Sharing & Security */}
                <div className="p-6 bg-orange-50 rounded-xl border-l-4 border-orange-600">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">3. Data Sharing & Security</h3>
                  <p className="text-gray-700 leading-relaxed">
                    We do not sell your data. We may share information with trusted service providers (e.g. payment
                    processors) under strict confidentiality. All personal data is stored securely and encrypted at rest.
                  </p>
                </div>

                {/* 4. Cookies */}
                <div>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <Cookie className="w-4 h-4 text-orange-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">4. Cookies</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed ml-11">
                    We use cookies to maintain your session, remember preferences, and gather analytics. You can
                    disable cookies in your browser but some features may not work properly.
                  </p>
                </div>

                {/* 5. Your Rights */}
                <div className="p-6 bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl border-2 border-orange-200">
                  <div className="flex items-start gap-3 mb-3">
                    <Mail className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <h3 className="text-xl font-bold text-gray-900">5. Your Rights</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    You have the right to access, correct, or delete your personal data. For any privacy requests,
                    please email us at:
                  </p>
                  <a 
                    href="mailto:privacy@myproductivespace.com" 
                    className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    privacy@myproductivespace.com
                  </a>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>

      <ContactSection />
      <FooterSection />
    </>
  )
}

