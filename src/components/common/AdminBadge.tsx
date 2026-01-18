"use client";

interface AdminBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function AdminBadge({ className = "", size = "md" }: AdminBadgeProps) {
  const sizeClasses = {
    sm: "w-4 h-4 text-[8px]",
    md: "w-5 h-5 text-[10px]",
    lg: "w-6 h-6 text-xs",
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-blue-500 border-2 border-black flex items-center justify-center ${className}`}
      title="Admin"
    >
      <span className={`font-bold text-white`}>A</span>
    </div>
  );
}

