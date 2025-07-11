"use client";
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface AdCarouselProps {
  images: string[];
  alt: string;
  className?: string;
  onImageLoad?: () => void;
}

export default function AdCarousel({ images, alt, className = "", onImageLoad }: AdCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  
  // Only show carousel if we have more than 1 image
  if (!images || images.length <= 1) {
    const singleImage = images?.[0];
    if (!singleImage) return null;
    
    return (
      <div className={`relative w-full ${className}`}>
        <img
          src={singleImage}
          alt={alt}
          className="w-full h-auto object-cover rounded-lg"
          onLoad={onImageLoad}
          onError={(e) => {
            console.error('Image failed to load:', singleImage);
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>
    );
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleImageLoad = (index: number) => {
    setLoadedImages(prev => {
      const newSet = new Set(prev);
      newSet.add(index);
      return newSet;
    });
    if (index === currentIndex && onImageLoad) {
      onImageLoad();
    }
  };

  return (
    <div className={`relative group w-full ${className}`}>
      {/* Main image */}
      <div className="relative w-full">
        <img
          src={images[currentIndex]}
          alt={`${alt} - ${currentIndex + 1} of ${images.length}`}
          className="w-full h-auto object-cover rounded-lg transition-opacity duration-300"
          onLoad={() => handleImageLoad(currentIndex)}
          onError={(e) => {
            console.error('Carousel image failed to load:', images[currentIndex]);
            const target = e.target as HTMLImageElement;
            target.style.opacity = '0.5';
          }}
        />
        
        {/* Preload adjacent images */}
        {images.map((src, index) => (
          index !== currentIndex && Math.abs(index - currentIndex) <= 1 && (
            <img
              key={`preload-${index}`}
              src={src}
              alt=""
              className="absolute opacity-0 pointer-events-none w-1 h-1"
              onLoad={() => handleImageLoad(index)}
              onError={() => {}}
            />
          )
        ))}
      </div>

      {/* Navigation buttons - only show on hover */}
      <div className="absolute inset-0 flex items-center justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={prevImage}
          className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2 h-8 w-8"
          disabled={images.length <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={nextImage}
          className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2 h-8 w-8"
          disabled={images.length <= 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Dots indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                index === currentIndex 
                  ? 'bg-white' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Image counter */}
      {images.length > 1 && (
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {currentIndex + 1}/{images.length}
        </div>
      )}
    </div>
  );
} 