"use client"

import * as React from "react"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
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
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Filter, ArrowUpDown, MoreVertical, Edit, Trash2, Send } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useExpensas } from "@/hooks/use-expensas"
import { expensasApi } from "@/lib/api"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { FormExpensa } from "@/components/expensas/form-expensa"

interface ExpensaData {
  id: string
  periodoId: string
  vecinoId: string
  monto: number
  estado: string
  fechaVencimiento: string
  vecino: {
    id: string
    nombre: string
    apellido: string
    email: string
    telefono?: string
    unidad?: string
  }
  periodo: {
    id: string
    mes: number
    anio: number
    country?: {
      id: string
      name: string
    }
  }
  _count?: {
    mensajes: number
    comprobantes: number
  }
}

const getEstadoBadge = (estado: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    PENDIENTE: "outline",
    PAGO_INFORMADO: "secondary",
    CONFIRMADO: "default",
    EN_MORA: "destructive",
    EN_RECUPERO: "destructive",
    SIN_RESPUESTA: "secondary",
    PAUSADO: "outline",
  }
  return variants[estado] || "outline"
}

const estados = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "PAGO_INFORMADO", label: "Pago Informado" },
  { value: "CONFIRMADO", label: "Confirmado" },
  { value: "EN_MORA", label: "En Mora" },
  { value: "EN_RECUPERO", label: "En Recupero" },
  { value: "SIN_RESPUESTA", label: "Sin Respuesta" },
  { value: "PAUSADO", label: "Pausado" },
]

export default function ExpensasPage() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [estadoFilter, setEstadoFilter] = React.useState<string>("")
  const [selectedRows, setSelectedRows] = React.useState<string[]>([])
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingExpensaId, setEditingExpensaId] = React.useState<string | undefined>()

  const { expensas, loading, error, refetch } = useExpensas(
    estadoFilter ? { estado: estadoFilter } : undefined
  )

  const columns: ColumnDef<ExpensaData>[] = React.useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={(e) => {
              table.toggleAllPageRowsSelected(e.target.checked)
              if (e.target.checked) {
                setSelectedRows(expensas.map((e) => e.id))
              } else {
                setSelectedRows([])
              }
            }}
            className="rounded border-gray-300"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selectedRows.includes(row.original.id)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedRows([...selectedRows, row.original.id])
              } else {
                setSelectedRows(selectedRows.filter((id) => id !== row.original.id))
              }
            }}
            className="rounded border-gray-300"
          />
        ),
        enableSorting: false,
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
          <div>
            <div className="font-medium">
              {row.original.vecino.nombre} {row.original.vecino.apellido}
            </div>
            {row.original.vecino.unidad && (
              <div className="text-sm text-muted-foreground">
                {row.original.vecino.unidad}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "periodo",
        header: "Período",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">
              {row.original.periodo.mes}/{row.original.periodo.anio}
            </div>
            {row.original.periodo.country && (
              <div className="text-sm text-muted-foreground">
                {row.original.periodo.country.name}
              </div>
            )}
          </div>
        ),
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
        cell: ({ row }) => {
          const monto = row.getValue("monto") as number
          return (
            <div className="font-medium">
              ${monto.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          )
        },
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
          return <Badge variant={getEstadoBadge(estado)}>{estado.replace("_", " ")}</Badge>
        },
      },
      {
        accessorKey: "fechaVencimiento",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2 hover:bg-transparent"
            >
              Vencimiento
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => {
          const fecha = new Date(row.getValue("fechaVencimiento"))
          return format(fecha, "dd/MM/yyyy", { locale: es })
        },
      },
      {
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => {
          const expensa = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEdit(expensa.id)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSend(expensa.id)}>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Recordatorio
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete(expensa.id)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [selectedRows, expensas]
  )

  const table = useReactTable({
    data: expensas,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  const handleEdit = (id: string) => {
    setEditingExpensaId(id)
    setFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta expensa?")) return

    const response = await expensasApi.delete(id)
    if (response.success) {
      refetch()
    } else {
      alert(response.error || "Error al eliminar expensa")
    }
  }

  const handleSend = async (id: string) => {
    // TODO: Implementar envío de recordatorio
    console.log("Enviar recordatorio:", id)
  }

  const handleBulkAction = async (action: string) => {
    if (selectedRows.length === 0) {
      alert("Selecciona al menos una expensa")
      return
    }

    // TODO: Implementar acciones masivas
    console.log("Acción masiva:", action, selectedRows)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Expensas</h1>
          <p className="text-slate-600 mt-1">
            Gestiona las expensas de los vecinos
          </p>
        </div>
        <Button onClick={() => {
          setEditingExpensaId(undefined)
          setFormOpen(true)
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Expensa
        </Button>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-purple-50/30 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-800">Listado de Expensas</CardTitle>
            {selectedRows.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction("send")}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Enviar ({selectedRows.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction("delete")}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar ({selectedRows.length})
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Input
              placeholder="Buscar por vecino, período..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-sm"
            />
            <Select value={estadoFilter || undefined} onValueChange={(value) => setEstadoFilter(value || "")}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                {estados.map((estado) => (
                  <SelectItem key={estado.value} value={estado.value}>
                    {estado.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setEstadoFilter("")
                setGlobalFilter("")
              }}
            >
              <Filter className="mr-2 h-4 w-4" />
              Limpiar Filtros
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">Cargando...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-destructive">{error}</div>
            </div>
          ) : (
            <>
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
                        No hay expensas.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando {table.getRowModel().rows.length} de {expensas.length} expensas
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <FormExpensa
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingExpensaId(undefined)
        }}
        expensaId={editingExpensaId}
        onSuccess={() => {
          refetch()
        }}
      />
    </div>
  )
}
