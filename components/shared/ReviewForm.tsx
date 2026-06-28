"use client";

import { useState, useRef } from "react";
import { Star, Upload, X } from "lucide-react";
import Image from "next/image";

export function ReviewForm() {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files)
      .slice(0, 4 - previews.length)
      .forEach((f) => setPreviews((p) => [...p, URL.createObjectURL(f)]));
  };

  const removeImage = (i: number) => {
    setPreviews((p) => {
      URL.revokeObjectURL(p[i]);
      return p.filter((_, j) => j !== i);
    });
  };

  return (
    <div className="bg-surface-card border border-hairline rounded-xl p-6 mt-8">
      <h3 className="font-medium text-ink mb-5">Write a Review</h3>

      {/* Star selector */}
      <div className="mb-4">
        <p className="text-xs text-muted uppercase tracking-wide mb-2">Your rating</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(s)}
            >
              <Star
                size={24}
                className={
                  s <= (hovered || rating)
                    ? "fill-accent-amber text-accent-amber transition-colors"
                    : "fill-hairline text-hairline transition-colors"
                }
              />
            </button>
          ))}
        </div>
      </div>

      {/* Review text */}
      <div className="mb-4">
        <textarea
          rows={4}
          placeholder="Share your experience with this product…"
          className="w-full px-3 py-2.5 text-sm border border-hairline rounded-md bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors resize-none"
        />
      </div>

      {/* Image upload */}
      <div className="mb-5">
        <p className="text-xs text-muted uppercase tracking-wide mb-2">Add photos of your product (up to 4)</p>
        <div className="flex flex-wrap gap-2">
          {previews.map((src, i) => (
            <div
              key={i}
              className="relative w-16 h-16 rounded-md overflow-hidden border border-hairline shrink-0"
            >
              <Image src={src} alt="" fill className="object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-ink/70 text-white flex items-center justify-center"
              >
                <X size={9} />
              </button>
            </div>
          ))}
          {previews.length < 4 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-16 h-16 rounded-md border border-dashed border-hairline flex items-center justify-center text-muted hover:border-primary hover:text-primary transition-colors shrink-0"
            >
              <Upload size={16} />
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      <button
        type="button"
        className="h-10 px-6 bg-primary text-on-primary text-sm font-medium rounded-md hover:bg-primary-active transition-colors"
      >
        Submit Review
      </button>
    </div>
  );
}
