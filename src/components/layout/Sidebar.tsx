import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Users,
  LogOut,
  Sparkles,
  ChevronRight,
  Stethoscope,
} from "lucide-react";

interface SidebarProps {
  currentPath?: string;
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const { user, logout } = useAuth();

  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Pacientes",
      path: "/pacientes",
      icon: Users,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col h-screen sticky top-0 shrink-0 select-none shadow-sm z-30">
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white shadow-md shadow-emerald-500/25">
            <Stethoscope className="h-5 w-5" />
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight text-slate-900 leading-tight">
              Nutri <span className="text-emerald-600">APP</span>
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 tracking-wider uppercase">
              RC Nutri Platform
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Menu Principal
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-5 w-5 transition-transform duration-150 group-hover:scale-110 ${
                        isActive ? "text-white" : "text-slate-400 group-hover:text-emerald-600"
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {isActive && <ChevronRight className="h-4 w-4 text-emerald-100" />}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Database connection badge */}
      <div className="px-4 py-3 mx-4 mb-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5">
        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-700 truncate flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-emerald-600" /> Neon PostgreSQL
          </p>
          <p className="text-[11px] text-slate-400 truncate">Tempo real conectado</p>
        </div>
      </div>

      {/* User profile & Logout footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/60">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center border border-emerald-300 shrink-0 text-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : "N"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-800 truncate" title={user?.name}>
                {user?.name || "Nutricionista"}
              </span>
              <span className="text-[11px] text-slate-500 truncate" title={user?.email}>
                {user?.email}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            title="Sair do sistema"
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
