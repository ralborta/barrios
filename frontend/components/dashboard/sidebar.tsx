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
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Expensas", href: "/expensas", icon: Building2 },
  { name: "Boletas", href: "/boletas", icon: Receipt },
  { name: "Vecinos", href: "/vecinos", icon: Users },
  { name: "Comprobantes", href: "/comprobantes", icon: FileText },
  { name: "Pagos", href: "/pagos", icon: CreditCard },
  { name: "Mensajes", href: "/mensajes", icon: MessageSquare },
  { name: "Templates", href: "/templates", icon: FileText },
  { name: "Importar CSV", href: "/importar", icon: Upload },
  { name: "Reportes", href: "/reportes", icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-64 flex-col bg-[#1e293b] text-white">
      {/* Logo/Header */}
      <div className="flex h-16 items-center gap-2 border-b border-slate-700 px-6">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6" />
          <span className="text-lg font-semibold">Dashboard</span>
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
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-slate-700 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
              {isActive && <Check className="ml-auto h-4 w-4" />}
            </Link>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-slate-700 p-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-800">
            <Avatar>
              <AvatarFallback>AD</AvatarFallback>
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
