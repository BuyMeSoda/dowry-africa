import { useState } from "react";

const AVATAR_COLORS = [
  "bg-rose-500",    "bg-orange-500",  "bg-amber-600",
  "bg-lime-600",    "bg-emerald-500", "bg-teal-600",
  "bg-cyan-600",    "bg-blue-500",    "bg-indigo-500",
  "bg-violet-500",  "bg-purple-500",  "bg-pink-500",
];

function getColor(name: string): string {
  const code = name?.charCodeAt(0) ?? 65;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

interface UserAvatarProps {
  name: string;
  photoUrl?: string | null;
  size?: number;
  className?: string;
  textClassName?: string;
}

export function UserAvatar({
  name,
  photoUrl,
  size,
  className = "",
  textClassName = "text-base font-bold",
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initial = (name ?? "?").charAt(0).toUpperCase();
  const color = getColor(name ?? "");
  const sizeStyle = size ? { width: size, height: size, minWidth: size, minHeight: size } : undefined;

  if (photoUrl && !imgError) {
    return (
      <img
        src={photoUrl}
        alt={name}
        onError={() => setImgError(true)}
        className={`object-cover ${className}`}
        style={sizeStyle}
      />
    );
  }

  return (
    <div
      className={`${color} flex items-center justify-center text-white select-none ${textClassName} ${className}`}
      style={sizeStyle}
    >
      {initial}
    </div>
  );
}
