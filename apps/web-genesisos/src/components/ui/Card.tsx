"use client";

import { cn } from "@/lib/utils";

interface CardProps {
  title?: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function Card({ title, subtitle, className, children, actions }: CardProps) {
  return (
    <div className={cn("bg-white rounded-lg shadow-sm border", className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            {title && <h3 className="text-base font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
