// frontend/src/components/logo-cloud.tsx
import { InfiniteSlider } from '@/components/ui/infinite-slider'
import { ProgressiveBlur } from '@/components/ui/progressive-blur'


const messages = [
    "Are you finding it hard to concentrate at home?",
    "Can't get work done with all the distractions?",
    "Miss the energy of a productive community?",
    "Struggling to stay motivated solo?",
    "Need a dedicated workspace that fuels creativity?"
]

export default function LogoCloud() {
    return (
        <section className="bg-background overflow-hidden py-8">
            <div className="group relative m-auto max-w-7xl px-6">
                {/* <div className="flex flex-col items-center md:flex-row justify-center">
                    <div className="relative py-6 md:w-[calc(100%-11rem)]">
                 */}
                 <div className="flex justify-center">
                 <div className="relative h-40 w-full md:w-[90%]"> {/* taller slider, wider container */}

                        <InfiniteSlider
                            speedOnHover={20}
                            speed={40}
                            gap={100}>
                            {messages.map((msg, i) => (
                                // <div key={i} className="flex items-center justify-center px-4">
                                //     <p className="text-lg font-medium whitespace-nowrap">{msg}</p>
                                <div key={i} className="flex items-center justify-center px-4">
                                    <p className="text-2xl font-semibold text-center max-w-xs">
                                      {msg}
                                    </p>
                                </div>
                            ))}
                        </InfiniteSlider>

                        <div className="bg-linear-to-r from-background absolute inset-y-0 left-0 w-20"></div>
                        <div className="bg-linear-to-l from-background absolute inset-y-0 right-0 w-20"></div>
                        <ProgressiveBlur
                            className="pointer-events-none absolute left-0 top-0 h-full w-20"
                            direction="left"
                            blurIntensity={1}
                        />
                        <ProgressiveBlur
                            className="pointer-events-none absolute right-0 top-0 h-full w-20"
                            direction="right"
                            blurIntensity={1}
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}
