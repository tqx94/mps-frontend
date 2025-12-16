// src/components/Carousel.tsx
'use client'

import React from 'react'
import Slider, { Settings } from 'react-slick'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import './Carousel.css'

type ArrowProps = {
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
}

function PrevArrow({ className, onClick }: ArrowProps) {
  return (
    <button
      type="button"
      className={`${className} carousel-arrow carousel-arrow-prev`}
      onClick={onClick}
      aria-label="Previous slide"
      title="Previous slide"
    >
      <ChevronLeft size={30} className="text-gray-700" />
    </button>
  )
}

function NextArrow({ className, onClick }: ArrowProps) {
  return (
    <button
      type="button"
      className={`${className} carousel-arrow carousel-arrow-next`}
      onClick={onClick}
      aria-label="Next slide"
      title="Next slide"
    >
      <ChevronRight size={30} className="text-gray-700" />
    </button>
  )
}

export const Carousel: React.FC<{
  children: React.ReactNode
  settings?: Partial<Settings>
}> = ({ children, settings = {} }) => {
  const defaultSettings: Settings = {
    dots: true,
    arrows: true,
    infinite: false,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2, slidesToScroll: 1 } },
      { breakpoint: 768,  settings: { slidesToShow: 1, slidesToScroll: 1 } },
    ],
  }

  return (
    <Slider {...defaultSettings} {...settings}>
      {React.Children.map(children, (child, i) => (
        <div key={i} className="px-2">
          {child}
        </div>
      ))}
    </Slider>
  )
}
