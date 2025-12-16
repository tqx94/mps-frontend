// src/components/Footer.tsx
'use client'
import Image from 'next/image'
import { FaFacebookF, FaInstagram, FaWhatsapp, FaMapMarkerAlt  } from 'react-icons/fa'


const menuLinks = [
  { label: 'Home', href: '' },
  { label: 'Booking', href: '#Booking' },
  { label: 'Manage my Booking', href: '#managemybooking' },
  { label: 'Location', href: '#Locations' },
  { label: 'Pricing', href: '#Pricing' },
  { label: 'Book Now', href: '#Book Now' },
]
const infoLinks = ['Spaces', 'Booking Types', 'Terms & Conditions', 'Privacy']

const whatsappInfo = {
  number: "+65 8920 2462",
  baseUrl: "https://api.whatsapp.com/send/",
  siteLink: "https://www.myproductivespace.com",
  get encodedMessage() {
    return `Hello, I came over from ${this.siteLink} and I would like to know more about your services.`;
  },
  get fullUrl() {
    return `${this.baseUrl}?phone=${this.number}&text=${encodeURIComponent(this.encodedMessage)}`;
  }
};

export function FooterSection() {
  
  return (
    <footer className="bg-[#efefe7] text-gray-800 py-8">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between gap-12">
          {/* <div className="space-y-2">
            <div className="text-white font-bold text-lg">MyProductiveSpace</div>
            <p>© MyProductiveSpace 2025. All rights reserved.</p>
          </div> */}
          <div className="flex flex-col items-start space-y-2">
            <Image
              src="/mock_img/logo1.png"     
              alt="MyProductiveSpace Logo"
              width={240}                   
              height={64}
              className="object-contain"
            />
           <p className="text-gray-700 text-sm">
              © MyProductiveSpace 2025. All rights reserved.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                      <div>
                        <p className="font-semibold text-black mb-2">Menu</p>
                        <ul className="space-y-1">
                        {menuLinks.map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className="text-gray-800 hover:text-gray-600">
                    {label}
                  </a>
                </li>
              ))}
              </ul>
            </div>

            <div>
              <p className="font-semibold text-gray-900 mb-2">Information</p>
              <ul className="space-y-1">
                {infoLinks.map((t) => (
                  <li key={t}>
                    <a href="/terms" className="text-gray-800 hover:text-gray-600">
                      {t}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-semibold text-gray-900 mb-2">Contact Info</p>
              <ul className="space-y-1">
                <li className="text-gray-800">
                <a 
                  href="tel:+6589202462"
                  className="text-gray-800 hover:text-gray-600 hover:underline"
                >
                  +65 8920 2462
                </a>
                  </li>
                <li className="text-gray-800">
                <a 
                  href="mailto:myproductivespacecontact@gmail.com"
                  className="text-gray-800 hover:text-gray-600 hover:underline"
                >
                  myproductivespacecontact@gmail.com
                </a>
                </li>
                <li className="text-gray-800">
                  <a 
                    href="https://maps.app.goo.gl/wAWnGw36L5Ls2kBf7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-800 hover:text-gray-600 hover:underline"
                  >
                    Blk 208 Hougang St 21 #01-201 S 530208
                  </a>
                </li>
              </ul>
            </div>

          <div>
                <p className="font-semibold text-gray-900 mb-2">Follow Us</p>
                <div className="flex space-x-4">
                    <a
                    href="https://www.facebook.com/people/My-Productive-Space/61575790394823/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="text-gray-800 hover:text-gray-600"
                    >
                    <FaFacebookF size={20} />
                    </a>
                    <a
                    href="https://instagram.com/temp"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="text-gray-800 hover:text-gray-600"
                    >
                    <FaInstagram size={20} />
                    </a>            
                    <a
                    href={whatsappInfo.fullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp"
                    className="text-gray-800 hover:text-gray-600"
                    >
                    <FaWhatsapp size={20} />
                    </a>
                    <a
                    href="https://maps.app.goo.gl/5Vjx5BBzuFLpWbCG8"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="View on Maps"
                    className="text-gray-800 hover:text-gray-600"
                    >
                    <FaMapMarkerAlt size={20} />
                    </a>
              </div>
          </div>
        </div>
      </div>
    </footer>

  )
}
