"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  FileText, 
  Upload, 
  BarChart3,
  Check,
  MessageSquare,
  Receipt,
  CreditCard
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "text-blue-400" },
  { name: "Expensas", href: "/expensas", icon: Building2, color: "text-purple-400" },
  { name: "Boletas", href: "/boletas", icon: Receipt, color: "text-orange-400" },
  { name: "Vecinos", href: "/vecinos", icon: Users, color: "text-green-400" },
  { name: "Comprobantes", href: "/comprobantes", icon: FileText, color: "text-cyan-400" },
  { name: "Pagos", href: "/pagos", icon: CreditCard, color: "text-emerald-400" },
  { name: "Mensajes", href: "/mensajes", icon: MessageSquare, color: "text-pink-400" },
  { name: "Templates", href: "/templates", icon: FileText, color: "text-indigo-400" },
  { name: "Importar CSV", href: "/importar", icon: Upload, color: "text-yellow-400" },
  { name: "Reportes", href: "/reportes", icon: BarChart3, color: "text-red-400" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-64 flex-col bg-gradient-to-b from-slate-800 to-slate-900 text-white shadow-2xl">
      {/* Logo/Header */}
      <div className="flex h-16 items-center gap-2 border-b border-slate-700/50 bg-gradient-to-r from-blue-600/20 to-purple-600/20 px-6 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-blue-400" />
          <span className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Dashboard</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-white shadow-lg shadow-blue-500/20 border border-blue-500/30"
                  : "text-slate-300 hover:bg-slate-800/50 hover:text-white hover:shadow-md"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 transition-all duration-200",
                isActive ? item.color : "text-slate-400 group-hover:text-blue-400"
              )} />
              <span className="flex-1">{item.name}</span>
              {isActive && <Check className="ml-auto h-4 w-4 text-blue-400" />}
            </Link>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50 p-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-800/50 transition-all duration-200 hover:shadow-md">
            <Avatar className="ring-2 ring-blue-500/30">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">AD</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">Admin</p>
            </div>
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem>Configuración</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Cerrar Sesión</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
