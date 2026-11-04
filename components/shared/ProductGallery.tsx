"use client";

import { useState } from "react";
import Image from "next/image";

export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const hasThumbs = images.length > 1;

  return (
    <div className="w-full">

      {/* ── Mobile: main image on top, thumbnail strip below ── */}
      <div className="lg:hidden flex flex-col gap-3">
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface-soft">
          <Image
            src={images[active]}
            alt={title}
            fill
            className="object-cover transition-opacity duration-300"
            priority
            sizes="100vw"
          />
        </div>
        {hasThumbs && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`relative w-16 aspect-[3/4] shrink-0 overflow-hidden transition-opacity ${
                  i === active
                    ? "ring-2 ring-primary ring-inset opacity-100"
                    : "opacity-40 hover:opacity-70"
                }`}
              >
                <Image src={src} alt={`${title} view ${i + 1}`} fill className="object-cover" sizes="64px" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Desktop: thumbnails on left, main image fills remaining space ── */}
      <div className="hidden lg:flex items-start gap-3">
        {hasThumbs && (
          <div className="w-24 shrink-0 flex flex-col gap-2">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`relative aspect-[3/4] w-full overflow-hidden transition-opacity ${
                  i === active
                    ? "ring-2 ring-primary ring-inset opacity-100"
                    : "opacity-40 hover:opacity-70"
                }`}
              >
                <Image src={src} alt={`${title} view ${i + 1}`} fill className="object-cover" sizes="96px" />
              </button>
            ))}
          </div>
        )}
        <div className="flex-1 relative aspect-[3/4] min-w-0 overflow-hidden bg-surface-soft">
          <Image
            src={images[active]}
            alt={title}
            fill
            className="object-cover transition-opacity duration-300"
            priority
            sizes="(max-width: 1200px) 45vw, 540px"
          />
        </div>
      </div>

    </div>
  );
}
