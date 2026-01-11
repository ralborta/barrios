"use client"

import { Search, Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const months = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 3 }, (_, i) => currentYear + i - 1)

export function Topbar() {
  const currentMonth = new Date().getMonth()
  const currentYearValue = new Date().getFullYear()
  const defaultValue = `${months[currentMonth]} ${currentYearValue}`

  return (
    <div className="flex h-16 items-center justify-between border-b bg-gradient-to-r from-white to-slate-50 px-6 shadow-sm">
      {/* Period Selector */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-blue-500" />
        <span className="text-sm text-gray-700 font-medium">Periodo:</span>
        <Select defaultValue={defaultValue}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) =>
              months.map((month, monthIndex) => (
                <SelectItem
                  key={`${monthIndex}-${year}`}
                  value={`${month} ${year}`}
                >
                  {month} {year}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Search */}
      <div className="flex flex-1 items-center justify-center px-8">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-400" />
          <Input
            type="search"
            placeholder="Buscar..."
            className="pl-10 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
          />
        </div>
      </div>

      {/* User Profile */}
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2">
            <Avatar>
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">Admin</span>
            <svg
              className="h-4 w-4 text-gray-500"
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
