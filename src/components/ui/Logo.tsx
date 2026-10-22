import React from "react";
import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className, size = "md", showTagline = false }) => {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  const iconSizes = {
    sm: "h-5 w-5",
    md: "h-7 w-7",
    lg: "h-9 w-9",
  };

  return (
    <div className={cn("inline-flex flex-col items-center justify-center gap-1", className)}>
      <div className="flex items-center gap-2.5">
        <div className="relative flex items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-2 text-white shadow-md shadow-emerald-500/20">
          <Leaf className={cn(iconSizes[size], "transition-transform hover:scale-110")} />
        </div>
        <div className="flex flex-col">
          <span className={cn("font-extrabold tracking-tight text-slate-900", sizeClasses[size])}>
            RC <span className="text-emerald-600">Nutri</span>
          </span>
        </div>
      </div>
      {showTagline && (
        <p className="text-xs font-medium text-slate-500 tracking-wide">
          Plataforma de Gestão Nutricional
        </p>
      )}
    </div>
  );
};
