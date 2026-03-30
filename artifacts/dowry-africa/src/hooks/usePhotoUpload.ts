import { useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { API_BASE } from "@/lib/api-url";

export function usePhotoUpload() {
  const { refreshUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const triggerPicker = () => inputRef.current?.click();

  const upload = async (file: File): Promise<string | null> => {
    if (!file.type.startsWith("image/")) return null;

    setUploading(true);
    setProgress(20);

    try {
      const formData = new FormData();
      formData.append("photo", file);

      setProgress(40);

      const res = await fetch(`${API_BASE}/api/users/me/photo`, {
        method: "POST",
        body: formData,
      });

      setProgress(85);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error ?? "Upload failed");
      }

      const { photoUrl } = await res.json();
      setProgress(100);
      await refreshUser();
      return photoUrl as string;
    } catch {
      return null;
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 600);
    }
  };

  return { uploading, progress, triggerPicker, inputRef, upload };
}
