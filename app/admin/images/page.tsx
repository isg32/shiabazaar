import { Upload, Search, Trash2, Copy, Filter } from "lucide-react";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Images" };

const W = "https://shiabazaar.com/wp-content/uploads";

const images = [
  { id: 1,  url: `${W}/2026/05/file_00000000ab6c7208899e7d70e3e33471.png`, name: "hero-banner.png",       size: "218 KB", folder: "Banners" },
  { id: 2,  url: `${W}/2026/06/Gemini_Generated_Image_-3.png`,              name: "hero-portrait.png",     size: "184 KB", folder: "Banners" },
  { id: 3,  url: `${W}/2025/10/nahjul-balagha-cover.jpg`,                   name: "nahjul-balagha.jpg",    size: "94 KB",  folder: "Products" },
  { id: 4,  url: `${W}/2025/10/tafseer-namoona-v1.jpg`,                     name: "tafseer-namoona-1.jpg", size: "101 KB", folder: "Products" },
  { id: 5,  url: `${W}/2025/10/tafseer-saafi-v1.jpg`,                       name: "tafseer-saafi-1.jpg",   size: "88 KB",  folder: "Products" },
  { id: 6,  url: `${W}/2025/10/alam-panja-brass.jpg`,                       name: "alam-panja-brass.jpg",  size: "132 KB", folder: "Products" },
  { id: 7,  url: `${W}/2025/10/mashak-brass.jpg`,                           name: "mashak-brass.jpg",      size: "76 KB",  folder: "Products" },
  { id: 8,  url: `${W}/2025/10/islamic-mug.jpg`,                            name: "islamic-mug.jpg",       size: "64 KB",  folder: "Products" },
  { id: 9,  url: `${W}/2025/10/prayer-mat-ladies.jpg`,                      name: "prayer-mat.jpg",        size: "112 KB", folder: "Products" },
  { id: 10, url: `${W}/2025/10/abaya-black.jpg`,                            name: "abaya-black.jpg",       size: "98 KB",  folder: "Products" },
  { id: 11, url: `${W}/2025/10/hijab-chiffon.jpg`,                          name: "hijab-chiffon.jpg",     size: "72 KB",  folder: "Products" },
  { id: 12, url: `${W}/2025/10/attar-oud-rose.jpg`,                         name: "attar-oud.jpg",         size: "58 KB",  folder: "Products" },
];

const folders = ["All", "Banners", "Products", "Categories", "Misc"];

export default function AdminImages() {
  return (
    <div className="px-8 py-8 text-on-dark">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-on-dark">Image Library</h1>
          <p className="text-sm text-on-dark-soft mt-0.5">{images.length} files · Powered by Cloudinary</p>
        </div>
        <button className="h-9 px-4 bg-primary text-white text-sm font-medium rounded-md flex items-center gap-2 hover:bg-primary-active transition-colors">
          <Upload size={14} /> Upload Images
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-dark-soft" />
          <input
            placeholder="Search by filename…"
            className="w-full h-9 pl-9 pr-3 text-sm bg-surface-dark-elevated border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-1 bg-surface-dark-elevated border border-white/8 rounded-md p-0.5">
          {folders.map((f, i) => (
            <button key={f} className={`px-3 h-7 text-xs font-medium rounded transition-colors ${i === 0 ? "bg-white/10 text-on-dark" : "text-on-dark-soft hover:text-on-dark"}`}>{f}</button>
          ))}
        </div>
      </div>

      {/* Upload drop zone */}
      <div className="border-2 border-dashed border-white/15 rounded-xl p-8 text-center mb-6 hover:border-primary/50 transition-colors cursor-pointer">
        <Upload size={24} className="mx-auto mb-2 text-on-dark-soft" />
        <p className="text-sm text-on-dark-soft">Drop images here or <span className="text-primary">browse</span></p>
        <p className="text-xs text-on-dark-soft/60 mt-1">PNG, JPG, WebP — max 5 MB each</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {images.map(img => (
          <div key={img.id} className="group relative bg-surface-dark-elevated rounded-lg overflow-hidden border border-white/8 hover:border-primary/40 transition-colors cursor-pointer">
            <div className="aspect-square relative">
              <Image
                src={img.url}
                alt={img.name}
                fill
                className="object-cover"
                sizes="150px"
              />
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button className="w-7 h-7 flex items-center justify-center rounded bg-white/10 text-white hover:bg-white/20 transition-colors" title="Copy URL">
                  <Copy size={12} />
                </button>
                <button className="w-7 h-7 flex items-center justify-center rounded bg-error/20 text-error hover:bg-error/30 transition-colors" title="Delete">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
            <div className="px-2 py-1.5">
              <p className="text-[11px] text-on-dark-soft truncate">{img.name}</p>
              <p className="text-[10px] text-on-dark-soft/60">{img.size}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-on-dark-soft">{images.length} of {images.length} files</span>
        <button className="text-xs text-primary hover:text-primary-active transition-colors">Load more</button>
      </div>
    </div>
  );
}
