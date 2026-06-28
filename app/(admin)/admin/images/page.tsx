import { Upload, Trash2, Copy } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Images" };

const images = Array.from({ length: 12 }, (_, i) => ({
  id: `img-${i + 1}`,
  url: `https://placehold.co/320x440/efe9de/141413?text=Image+${i + 1}`,
  name: `product-image-${i + 1}.jpg`,
  size: `${(Math.random() * 400 + 80).toFixed(0)} KB`,
  used: i < 8,
}));

export default function AdminImagesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Image Library</h1>
        <p className="text-xs text-muted">{images.length} images · stored on Cloudinary</p>
      </div>

      {/* Upload zone */}
      <div className="border-2 border-dashed border-hairline rounded-xl p-10 text-center hover:border-primary/40 transition-colors cursor-pointer bg-canvas">
        <Upload size={24} className="mx-auto text-muted mb-3" />
        <p className="text-sm font-medium text-ink">Drop images here or <span className="text-primary">browse</span></p>
        <p className="text-xs text-muted mt-1">PNG, JPG, WebP · Max 5MB per file · Uploaded to Cloudinary</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {images.map((img) => (
          <div key={img.id} className="group relative rounded-lg overflow-hidden border border-hairline bg-surface-card aspect-square">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-ink/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
              <button className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors">
                <Copy size={12} />
              </button>
              <button className="w-7 h-7 rounded-full bg-error/80 hover:bg-error flex items-center justify-center text-white transition-colors">
                <Trash2 size={12} />
              </button>
            </div>
            {!img.used && (
              <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-warning" title="Unused" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
