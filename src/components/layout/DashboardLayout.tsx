import React from "react";
import { Sidebar } from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50/70 flex font-sans text-slate-800 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Menu lateral fixo com logo Nutri APP no topo */}
      <Sidebar />

      {/* Área principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
