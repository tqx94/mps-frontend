// src/components/ContactSection.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

const inputClasses =
  'w-full p-3 rounded-lg bg-white text-black placeholder-gray-500 border border-gray-300 h-12'
const textareaClasses =
  'w-full p-3 rounded-lg bg-white text-black placeholder-gray-500 border border-gray-300 resize-none'


export function ContactSection() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const whatsappInfo = {
    number: "6589202462",
    baseUrl: "https://api.whatsapp.com/send/",
  };
  
  const handleWhatsApp = () => {
    const messageText = `Hello, I came over from https://www.myproductivespace.com and would like to know more about your services.
  Name: ${name}
  Email: ${email}
  Subject: ${subject}
  Inquiry: ${message}`;
    const fullUrl = `${whatsappInfo.baseUrl}?phone=${whatsappInfo.number}&text=${encodeURIComponent(messageText)}`;
    window.open(fullUrl, "_blank", "noopener,noreferrer");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const mailto = [
      `mailto:myproductivespacecontact@gmail.com`,
      `subject=${encodeURIComponent(subject)}`,
      `body=${encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\n\n${message}`
      )}`,
    ].join('?')
    window.location.href = mailto
  }

  return (
    <div>
      <div>
        <section id="ContactUs" className="pt-12  bg-[#E0BEB8] text-black">
          <div className="container mx-auto px-6 py-12">
            <h2 className="text-4xl font-serif text-black mb-6">Contact Us</h2>
            <form
              onSubmit={handleSubmit}
              className="flex flex-col lg:flex-row gap-8 items-stretch"
            >

              {/* 2) Left column: three small inputs */}
              <div className="flex flex-col space-y-4 lg:w-1/3">

                <input
                  type="email"
                  required
                  placeholder="Your Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClasses}
                />
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClasses}
                />
                <input
                  type="text"
                  required
                  placeholder="Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={inputClasses}
                />
              </div>
              {/* 3) Right columns: big message box + button */}
              <div className="flex flex-col space-y-4 lg:w-2/3 min-h-0">
                <textarea
                  required
                  placeholder="Your Message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className={`${textareaClasses} flex-1 min-h-0`} />
                <div className="mt-auto flex justify-end space-x-4 flex-col md:flex-row gap-4">
                  <Button type="submit" className="px-10 w-full py-4 text-lg bg-[#A15630] hover:bg-orange-600  transition-colors duration-200">
                    Send via Email
                  </Button>
                  <Button type="button" onClick={handleWhatsApp} className="px-10 py-4 text-lg text-white bg-[#128C7E] hover:bg-[#25D366] transition-colors duration-200">
                    Send via WhatsApp
                  </Button>

                </div>

              </div>

            </form>
          </div>

        </section>


      </div>


    </div>

  )
}
{/* Optional: Contact Us Form */ }
{/* <section id="Contact Us">
        <div className="container mx-auto bg-gray-900 text-white rounded-xl p-12">
          <h2 className="text-4xl font-serif">Contact Us</h2>
          <form className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
            <input type="email" placeholder="Enter your email" className="col-span-1 p-4 rounded-lg text-gray-800" />
            <input type="text" placeholder="Enter your name" className="col-span-1 p-4 rounded-lg text-gray-800" />
            <textarea placeholder="Enter your message" className="col-span-1 p-4 rounded-lg text-white-800" rows={1} />
            <Button className="col-span-1 bg-orange-500">Send Now</Button>
          </form>
        </div>
        <footer className="container mx-auto mt-8 flex flex-col md:flex-row justify-between text-sm text-gray-500">
          <div>
            <div className="font-bold">MyProductiveSpace</div>
            <p>© MyProductiveSpace 2025 All rights reserved</p>
          </div>
          <div className="flex space-x-12">
            <div>
              <p className="font-semibold">Menu</p>
              <ul>
                {['Home','Explore','Travel','Blog','Pricing'].map((t) => (<li key={t}><a href="#">{t}</a></li>))}
              </ul>
            </div>
            <div>
              <p className="font-semibold">Information</p>
              <ul>
                {['Spaces','Booking Types','Terms & Conditions','Privacy'].map((t) => (<li key={t}><a href="#">{t}</a></li>))}
              </ul>
            </div>
            <div>
              <p className="font-semibold">Contact Info</p>
              <p>+65 9113 1752</p>
              <p>contact@myproductivespace.com</p>
              <p>#01-201, Singapore</p>
            </div>
            <div>
              <p className="font-semibold">Follow & Contact us on</p>
              <div className="flex space-x-4 mt-2">
                <a href="#">FB</a><a href="#">IG</a><a href="#">TW</a>
              </div>
            </div>
          </div>
        </footer>
      </section> */}