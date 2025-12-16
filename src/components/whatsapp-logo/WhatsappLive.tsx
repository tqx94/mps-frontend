'use client'
import {useEffect} from 'react'
import React from 'react'
import Image from 'next/image';

const WhatsappLive = () => {
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

    useEffect(() => {
        const handleScroll = () => {
            const whatsappLinkElement = document.querySelector('.whatsapp-link');
            if (window.scrollY>100) {
                whatsappLinkElement?.classList.add("visible");
            }
            else {
                whatsappLinkElement?.classList.remove("visible");
            }
    };
    const checkScrollVisibility = () => {
        const whatsappLinkElement = document.querySelector('.whatsapp-link');
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;
        if (scrollHeight > clientHeight) {
           handleScroll();
           window.addEventListener('scroll', handleScroll);
        } else {
            whatsappLinkElement?.classList.add("visible");
        }
    };
    checkScrollVisibility();
    // window.addEventListener('scroll', handleScroll);

    return () => {
        window.removeEventListener('scroll', handleScroll);
    };
    
    }, []    );

  return (
    <div>
        <a
          href={whatsappInfo.fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="whatsapp-link relative"
        >
            <span className="absolute left-[7px] top-[7px] -z-50 size-10">
                <span className="flex size-full items-center justify-center animate-ping rounded-full bg-green-500 opacity-75">    
                </span>
            </span>
            <Image
                src="/mock_img/whatsapp_icon.png"
                    alt="WhatsApp Icon"
                   width={40}
                    height={40}
                   className="whatsapp-icon z-50"
                />
        </a>
       
    </div>
  )
}

export default WhatsappLive