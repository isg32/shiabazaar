"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { Upload, Grid2X2, X, Check, Loader2 } from "lucide-react";

interface CloudinaryAsset {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
}

interface ImagePickerProps {
  folder: string; // e.g. "shiabazaar/products/my-book"
  value?: string; // selected public_id
  onChange: (publicId: string, url: string) => void;
  onClose?: () => void;
}

type Tab = "upload" | "library";

export function ImagePicker({ folder, value, onChange, onClose }: ImagePickerProps) {
  const [tab, setTab] = useState<Tab>("library");
  const [assets, setAssets] = useState<CloudinaryAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState(value ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cloudinary/assets?folder=${encodeURIComponent(folder)}`);
      const data = await res.json();
      setAssets(data.assets ?? []);
    } finally {
      setLoading(false);
    }
  }, [folder]);

  useEffect(() => {
    if (tab === "library") loadAssets();
  }, [tab, loadAssets]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const sigRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder }),
      });
      const { timestamp, signature, apiKey, cloudName } = await sigRes.json();

      const form = new FormData();
      form.append("file", file);
      form.append("folder", folder);
      form.append("timestamp", timestamp);
      form.append("signature", signature);
      form.append("api_key", apiKey);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: form }
      );
      const uploaded = await uploadRes.json();
      onChange(uploaded.public_id, uploaded.secure_url);
      setSelected(uploaded.public_id);
      setTab("library");
      loadAssets();
    } finally {
      setUploading(false);
    }
  }

  function confirm() {
    const asset = assets.find((a) => a.public_id === selected);
    if (asset) onChange(asset.public_id, asset.secure_url);
    onClose?.();
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-hairline">
        {(["library", "upload"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-primary text-ink"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t === "library" ? <Grid2X2 size={14} /> : <Upload size={14} />}
            {t === "library" ? "Library" : "Upload"}
          </button>
        ))}
        {onClose && (
          <button onClick={onClose} className="ml-auto px-4 text-muted hover:text-ink">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {tab === "upload" ? (
          <div
            className="border-2 border-dashed border-hairline rounded-lg p-10 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            {uploading ? (
              <Loader2 size={24} className="animate-spin text-muted" />
            ) : (
              <>
                <Upload size={24} className="text-muted" />
                <p className="text-sm text-muted text-center">
                  Click to upload an image<br />
                  <span className="text-xs">JPG, PNG, WebP — up to 10 MB</span>
                </p>
              </>
            )}
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-muted" />
          </div>
        ) : assets.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted">No images in this folder yet.</p>
            <button onClick={() => setTab("upload")} className="mt-3 text-xs text-primary underline underline-offset-2">
              Upload one
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {assets.map((asset) => {
              const isSelected = asset.public_id === selected;
              return (
                <button
                  key={asset.public_id}
                  onClick={() => setSelected(asset.public_id)}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                    isSelected ? "border-primary" : "border-transparent hover:border-hairline"
                  }`}
                >
                  <Image
                    src={asset.secure_url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="120px"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-ink/20 flex items-center justify-center">
                      <Check size={20} className="text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {tab === "library" && selected && (
        <div className="p-4 border-t border-hairline flex justify-end gap-2">
          {onClose && (
            <button onClick={onClose} className="px-4 py-2 text-sm border border-hairline rounded-md text-muted hover:text-ink transition-colors">
              Cancel
            </button>
          )}
          <button
            onClick={confirm}
            className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary-active transition-colors"
          >
            Select image
          </button>
        </div>
      )}
    </div>
  );
}
