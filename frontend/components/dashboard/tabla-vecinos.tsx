"use client"

import * as React from "react"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, Send, Play, MoreVertical, ArrowUpDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useExpensas } from "@/hooks/use-expensas"
import { format } from "date-fns"

interface VecinoData {
  id: string
  vecino: {
    id: string
    nombre: string
    apellido: string
    unidad?: string
  }
  estado: string
  monto: number
  fechaVencimiento: string
  fechaUltimoSeguimiento?: string
  proximoSeguimiento?: string
}

const getEstadoBadge = (estado: string) => {
  const variants: Record<string, "pending" | "mora" | "warning" | "sinRespuesta"> = {
    PENDIENTE: "pending",
    EN_MORA: "mora",
    CONFIRMADO: "warning",
    SIN_RESPUESTA: "sinRespuesta",
    PAGO_INFORMADO: "warning",
    EN_RECUPERO: "mora",
    PAUSADO: "sinRespuesta",
  }
  return variants[estado] || "pending"
}

export function TablaVecinos() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const { expensas, loading } = useExpensas()

  const columns: ColumnDef<VecinoData>[] = React.useMemo(
    () => [
      {
        accessorKey: "vecino.unidad",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2 hover:bg-transparent"
            >
              Lote
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => (
          <div className="font-medium">{row.original.vecino.unidad || "-"}</div>
        ),
      },
      {
        accessorKey: "vecino.nombre",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2 hover:bg-transparent"
            >
              Vecino
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => (
          <div>{`${row.original.vecino.nombre} ${row.original.vecino.apellido}`}</div>
        ),
      },
      {
        accessorKey: "estado",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2 hover:bg-transparent"
            >
              Estado
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => {
          const estado = row.getValue("estado") as string
          return <Badge variant={getEstadoBadge(estado)}>{estado}</Badge>
        },
      },
      {
        accessorKey: "monto",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2 hover:bg-transparent"
            >
              Monto
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => (
          <div>${row.original.monto.toLocaleString()}</div>
        ),
      },
      {
        accessorKey: "fechaUltimoSeguimiento",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2 hover:bg-transparent"
            >
              Último Contacto
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => {
          const fecha = row.original.fechaUltimoSeguimiento
          if (!fecha) return <span>-</span>
          return (
            <div>
              {format(new Date(fecha), "dd/MM/yyyy")}
            </div>
          )
        },
      },
      {
        accessorKey: "proximoSeguimiento",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2 hover:bg-transparent"
            >
              Próxima Acción
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => {
          const fecha = row.original.proximoSeguimiento
          if (!fecha) return <span>-</span>
          const proximaFecha = new Date(fecha)
          const hoy = new Date()
          const diffDays = Math.ceil((proximaFecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
          
          let texto = ""
          if (diffDays < 0) texto = "Vencido"
          else if (diffDays === 0) texto = "Hoy"
          else if (diffDays === 1) texto = "Mañana"
          else texto = `En ${diffDays} días`
          
          return (
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-muted-foreground" />
              <span>{texto}</span>
            </div>
          )
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const expensa = row.original
          return (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                Ver
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Pausar</DropdownMenuItem>
                  <DropdownMenuItem>Editar</DropdownMenuItem>
                  <DropdownMenuItem>Eliminar</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data: expensas as VecinoData[],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Listado de Vecinos</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Importar CSV
            </Button>
            <Button size="sm">
              <Send className="mr-2 h-4 w-4" />
              Enviar Emisión
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
              <p className="text-muted-foreground">Cargando...</p>
            </div>
          </div>
        ) : (
          <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No hay resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        )}
      </CardContent>
    </Card>
  )
}
