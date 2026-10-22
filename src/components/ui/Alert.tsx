import React from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertProps {
  type?: "error" | "success" | "info";
  message: string;
  className?: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ type = "error", message, className }) => {
  if (!message) return null;

  const styles = {
    error: "bg-red-50/90 border-red-200 text-red-700",
    success: "bg-emerald-50/90 border-emerald-200 text-emerald-800",
    info: "bg-blue-50/90 border-blue-200 text-blue-700",
  };

  const icons = {
    error: <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />,
    info: <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />,
  };

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl border p-3.5 text-xs font-medium leading-relaxed transition-all",
        styles[type],
        className
      )}
      role="alert"
    >
      {icons[type]}
      <div className="flex-1 text-left">{message}</div>
    </div>
  );
};
