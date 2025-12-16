// frontend/src/components/landing-page-sections/LatestAnnouncementSection.tsx
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Carousel } from '@/components/Carousel'
import { getAllAnnouncements, type Announcement } from '@/lib/announcementService'

export default function LatestAnnouncementSection() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchAnnouncements()
    }, [])

    const fetchAnnouncements = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await getAllAnnouncements()
            if (response.success && Array.isArray(response.data)) {
                setAnnouncements(response.data)
            } else {
                setError('Failed to load announcements')
            }
        } catch (err) {
            setError('Failed to load announcements')
            console.error('Error fetching announcements:', err)
        } finally {
            setIsLoading(false)
        }
    }

    // Don't render anything if there are no announcements
    if (!isLoading && (announcements.length === 0 || error)) {
        return null
    }

    return (
        <section id="LatestAnnouncements" className="py-8 bg-gradient-to-b from-gray-50 to-white">
            <div className="container mx-auto text-center">
                <h2 className="text-4xl font-serif mb-2">Latest Announcements</h2>
                <p className="text-gray-600 max-w-2xl mx-auto mb-6">
                    Stay updated with our latest news and special offers
                </p>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                    </div>
                ) : (
                    <div className="mt-6">
                        <Carousel>
                            {announcements.map((announcement) => (
                                <div key={announcement.id} className="relative group">
                                    {announcement.imageUrl ? (
                                        <div className="relative h-[300px] w-full overflow-hidden rounded-lg shadow-lg">
                                            <Image
                                                src={announcement.imageUrl}
                                                alt={announcement.title}
                                                fill
                                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                onError={(e) => {
                                                    // Hide broken image and show fallback gradient
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                    const parent = target.parentElement; // This is the div with relative h-[300px]...
                                                    if (parent) {
                                                        // Remove image-specific overlay and add fallback styling
                                                        const overlay = parent.querySelector('.absolute.inset-0.bg-gradient-to-t');
                                                        if (overlay) {
                                                            overlay.remove();
                                                        }
                                                        parent.classList.remove('overflow-hidden'); // Allow text to center
                                                        parent.classList.add('bg-gradient-to-br', 'from-gray-100', 'to-gray-300', 'flex', 'items-center', 'justify-center', 'p-8');
                                                        // Adjust text color for better contrast on light background
                                                        const textContainer = parent.querySelector('.absolute.bottom-0');
                                                        if (textContainer) {
                                                            textContainer.classList.remove('text-white');
                                                            textContainer.classList.add('text-gray-800', 'static', 'text-center'); // Make text static and centered
                                                        }
                                                    }
                                                }}
                                            />
                                            {/* Overlay with gradient for better text readability */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

                                            {/* Text Content */}
                                            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                                <h4 className="font-bold text-xl mb-2">{announcement.title}</h4>
                                                {announcement.description && (
                                                    <p className="text-sm opacity-90 line-clamp-2">
                                                        {announcement.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        // Fallback for announcements without images - same as broken image style
                                        <div className="relative h-[300px] w-full overflow-hidden rounded-lg shadow-lg bg-gradient-to-br from-gray-100 to-gray-300 flex items-center justify-center p-8">
                                            <div className="text-gray-800 text-center">
                                                <h4 className="font-bold text-2xl mb-3">{announcement.title}</h4>
                                                {announcement.description && (
                                                    <p className="text-base opacity-90 line-clamp-3">
                                                        {announcement.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </Carousel>
                    </div>
                )}
            </div>
        </section>
    )
}
