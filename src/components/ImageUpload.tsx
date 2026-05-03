import React, { useState, useRef } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/src/lib/supabase";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface ImageUploadProps {
  onUpload: (url: string) => void;
  value?: string;
  label?: string;
  description?: string;
  bucket?: string;
}

export function ImageUpload({
  onUpload,
  value,
  label = "Image",
  description = "Upload a JPG, PNG or WebP image. Max 5MB.",
  bucket = "website-assets",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validation
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      if (
        !["image/jpeg", "image/png", "image/webp", "image/svg+xml"].includes(
          file.type,
        )
      ) {
        toast.error("Only image files are allowed (JPG, PNG, WebP, SVG)");
        return;
      }

      setUploading(true);

      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      // Upload to Supabase
      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        if (
          uploadError.message?.includes("bucket not found") ||
          uploadError.message?.includes("Bucket not found")
        ) {
          toast.error(
            `Bucket "${bucket}" not found. Please create it in your Supabase storage dashboard.`,
          );
        } else {
          throw uploadError;
        }
        return;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(filePath);

      onUpload(publicUrl);
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(
        `Upload failed: ${error.message || "Check if storage is configured"}`,
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = () => {
    onUpload("");
  };

  return (
    <div className="space-y-4">
      {label && (
        <label className="block text-sm font-semibold text-slate-900 dark:text-white">
          {label}
        </label>
      )}
      <div className="flex flex-col gap-4">
        {value ? (
          <div className="relative group w-full aspect-video rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <img
              src={value}
              alt="Uploaded thumbnail"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={removeImage}
                className="rounded-xl"
              >
                <X className="h-4 w-4 mr-1" /> Remove
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl"
              >
                <Upload className="h-4 w-4 mr-1" /> Replace
              </Button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-video rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all hover:border-indigo-400 group"
          >
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-110">
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Upload className="h-6 w-6" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {uploading ? "Uploading..." : "Click to upload"}
              </p>
              <p className="text-xs text-slate-500 mt-1">{description}</p>
            </div>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleUpload}
          accept="image/*"
          className="hidden"
        />
      </div>
    </div>
  );
}
