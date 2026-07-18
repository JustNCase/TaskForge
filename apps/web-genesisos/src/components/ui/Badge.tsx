"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
  children: React.ReactNode;
  className?: string;
}

const badgeVariants = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
};

const badgeSizes = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
};

export function Badge({ variant = "default", size = "sm", children, className }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center font-medium rounded-full", badgeVariants[variant], badgeSizes[size], className)}>
      {children}
    </span>
  );
}
