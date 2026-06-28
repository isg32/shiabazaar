"use client";

import { useState } from "react";
import Image from "next/image";

interface ProductGalleryProps {
  images: string[];
  title: string;
}

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface-soft">
        <Image
          src={images[active]}
          alt={title}
          fill
          className="object-cover transition-opacity duration-300"
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>

      {/* Thumbnails — only when there are extra images */}
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative w-14 aspect-[3/4] overflow-hidden shrink-0 transition-opacity ${
                i === active ? "ring-2 ring-primary ring-offset-1" : "opacity-50 hover:opacity-80"
              }`}
            >
              <Image
                src={src}
                alt={`${title} view ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
