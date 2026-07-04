"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Upload, Search, Trash2, Copy, Check, Loader2, X } from "lucide-react";
import Image from "next/image";

type Asset = {
  public_id:  string;
  secure_url: string;
  format:     string;
  bytes:      number;
  created_at: string;
};

function fmtBytes(b: number) {
  if (b >= 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.round(b / 1024)} KB`;
}

function folderOf(publicId: string) {
  const parts = publicId.split("/");
  if (parts.length < 2) return "Misc";
  const seg = parts[1];
  if (seg === "products")   return "Products";
  if (seg === "banners")    return "Banners";
  if (seg === "categories") return "Categories";
  return "Misc";
}

function nameOf(publicId: string) {
  return publicId.split("/").pop() ?? publicId;
}

const FOLDERS = ["All", "Banners", "Products", "Categories", "Misc"];

export default function AdminImages() {
  const [assets,   setAssets]   = useState<Asset[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [query,    setQuery]    = useState("");
  const [folder,   setFolder]   = useState("All");
  const [copied,   setCopied]   = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploading,setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/cloudinary")
      .then(r => r.json())
      .then(d => { setAssets(d.assets ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assets.filter(a =>
      (folder === "All" || folderOf(a.public_id) === folder) &&
      (!q || nameOf(a.public_id).toLowerCase().includes(q))
    );
  }, [assets, query, folder]);

  function copyUrl(publicId: string, url: string) {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(publicId);
    setTimeout(() => setCopied(null), 1500);
  }

  async function deleteAsset(publicId: string) {
    setDeleting(publicId);
    await fetch("/api/admin/cloudinary", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId }),
    });
    setAssets(prev => prev.filter(a => a.public_id !== publicId));
    setDeleting(null);
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      try {
        const { timestamp, signature, apiKey, cloudName, folder: signedFolder } = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder: "shiabazaar/misc" }),
        }).then(r => r.json());

        const fd = new FormData();
        fd.append("file", file);
        fd.append("timestamp", timestamp);
        fd.append("signature", signature);
        fd.append("api_key", apiKey);
        fd.append("folder", signedFolder);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: fd }).then(r => r.json());
        if (res.public_id) {
          setAssets(prev => [{
            public_id: res.public_id,
            secure_url: res.secure_url,
            format: res.format,
            bytes: res.bytes,
            created_at: res.created_at,
          }, ...prev]);
        }
      } catch { /* skip failed uploads */ }
    }
    setUploading(false);
  }

  return (
    <div className="px-8 py-8 text-on-dark">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-on-dark">Image Library</h1>
          <p className="text-sm text-on-dark-soft mt-0.5">{filtered.length} of {assets.length} files · Cloudinary</p>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="h-9 px-4 bg-primary text-white text-sm font-medium rounded-md flex items-center gap-2 hover:bg-primary-active transition-colors disabled:opacity-60"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {uploading ? "Uploading…" : "Upload"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple className="sr-only" onChange={e => uploadFiles(e.target.files)} />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-dark-soft" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by filename…"
            className="w-full h-9 pl-9 pr-3 text-sm bg-surface-dark-elevated border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary" />
        </div>
        <div className="flex items-center gap-1 bg-surface-dark-elevated border border-white/8 rounded-md p-0.5 shrink-0">
          {FOLDERS.map(f => (
            <button key={f} onClick={() => setFolder(f)}
              className={`px-3 h-7 text-xs font-medium rounded transition-colors ${folder === f ? "bg-white/10 text-on-dark" : "text-on-dark-soft hover:text-on-dark"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); uploadFiles(e.dataTransfer.files); }}
        className="border-2 border-dashed border-white/15 rounded-xl p-8 text-center mb-6 hover:border-primary/50 transition-colors cursor-pointer"
      >
        <Upload size={24} className="mx-auto mb-2 text-on-dark-soft" />
        <p className="text-sm text-on-dark-soft">Drop images here or <span className="text-primary">browse</span></p>
        <p className="text-xs text-on-dark-soft/60 mt-1">PNG, JPG, WebP — uploads to shiabazaar/misc</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-on-dark-soft">
          <Loader2 size={16} className="animate-spin" /> Loading images…
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-on-dark-soft text-center py-10">
          {assets.length === 0 ? "No images uploaded yet." : "No images match your search."}
        </p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {filtered.map(img => (
            <div key={img.public_id} className="group relative bg-surface-dark-elevated rounded-lg overflow-hidden border border-white/8 hover:border-primary/40 transition-colors">
              <div className="aspect-square relative">
                <Image src={img.secure_url} alt={nameOf(img.public_id)} fill className="object-cover" sizes="150px" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => copyUrl(img.public_id, img.secure_url)}
                    className="w-7 h-7 flex items-center justify-center rounded bg-white/10 text-white hover:bg-white/20 transition-colors" title="Copy URL">
                    {copied === img.public_id ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                  <button onClick={() => deleteAsset(img.public_id)} disabled={deleting === img.public_id}
                    className="w-7 h-7 flex items-center justify-center rounded bg-error/20 text-error hover:bg-error/30 transition-colors disabled:opacity-50" title="Delete">
                    {deleting === img.public_id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                  </button>
                </div>
              </div>
              <div className="px-2 py-1.5">
                <p className="text-[11px] text-on-dark-soft truncate">{nameOf(img.public_id)}</p>
                <p className="text-[10px] text-on-dark-soft/60">{fmtBytes(img.bytes)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
