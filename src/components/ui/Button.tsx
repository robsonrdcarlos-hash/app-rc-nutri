import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading = false, disabled, children, ...props }, ref) => {
    const baseStyles =
      "relative inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed select-none rounded-xl active:scale-[0.98]";

    const variants = {
      primary:
        "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/35 border border-emerald-500/30",
      secondary:
        "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60",
      outline:
        "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm",
      ghost:
        "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
      danger:
        "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20",
    };

    const sizes = {
      sm: "h-9 px-3 text-xs gap-1.5",
      md: "h-11 px-4 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin shrink-0 text-current" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
