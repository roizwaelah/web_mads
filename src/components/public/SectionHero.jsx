import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { normalizeMediaUrl } from '../../utils/http';

export default function Hero({ themeSettings }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const sliders = themeSettings?.sliders?.length > 0 
    ? themeSettings.sliders 
    : [{ id: 1, image: 'https://images.unsplash.com/photo-1523580494112-071d31174ee8?auto=format&fit=crop&q=80', title: 'SELAMAT DATANG', subtitle: 'Media Resmi MA Darussalam Cilongok' }];

  useEffect(() => {
    if (sliders.length <= 1) return;
    const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % sliders.length), 5000);
    return () => clearInterval(timer);
  }, [sliders.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % sliders.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? sliders.length - 1 : prev - 1));

  return (
    <section className="relative h-96 lg:h-[85vh] lg:max-h-[700px] flex items-center justify-center text-center overflow-hidden group animate-[fadeIn_0.3s_ease-in]">
      {sliders.map((slide, index) => {
        const bgUrl = slide.image ? normalizeMediaUrl(slide.image) : slide.image;
        return (
        <div key={slide.id} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
          <img
            src={bgUrl}
            alt={slide.title || 'Hero'}
            className="absolute inset-0 w-full h-full object-cover"
            loading={index === 0 ? 'eager' : 'lazy'}
            fetchpriority={index === 0 ? 'high' : 'auto'}
            decoding="async"
          />
          <div className="absolute inset-0 bg-black/60"></div>
          <div className="relative z-10 text-white px-4 h-full flex flex-col items-center justify-center mt-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-wide uppercase leading-tight drop-shadow-md">{slide.title}</h1>
            <p className="text-lg md:text-xl text-gray-200 max-w-2xl drop-shadow-sm">{slide.subtitle}</p>
            {slide.buttonText && (
              <a href={slide.buttonLink || '#'} className="mt-8 bg-(--accent) hover:opacity-90 text-white px-8 py-3.5 rounded-full font-bold shadow-lg transition-transform hover:scale-105 inline-block text-sm uppercase tracking-wider">
                {slide.buttonText}
              </a>
            )}
          </div>
        </div>
      )})}
      {sliders.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            aria-label="Prev Slide"
            type="button"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-(--accent) text-white rounded-full flex items-center justify-center backdrop-blur-sm transition z-20 opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Next Slide"
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-(--accent) text-white rounded-full flex items-center justify-center backdrop-blur-sm transition z-20 opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}
    </section>
  );
}
