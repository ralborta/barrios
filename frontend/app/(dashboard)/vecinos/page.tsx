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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Filter, ArrowUpDown, Edit, Trash2, Eye } from "lucide-react"
import { vecinosApi, countriesApi } from "@/lib/api"
import { FormVecino } from "@/components/vecinos/form-vecino"
import { useRouter } from "next/navigation"

interface VecinoData {
  id: string
  nombre: string
  apellido: string
  email: string
  telefono?: string
  unidad?: string
  country: {
    id: string
    name: string
  }
}

export default function VecinosPage() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [countryFilter, setCountryFilter] = React.useState<string>("")
  const [vecinos, setVecinos] = React.useState<VecinoData[]>([])
  const [countries, setCountries] = React.useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingVecinoId, setEditingVecinoId] = React.useState<string | undefined>()
  const router = useRouter()

  React.useEffect(() => {
    fetchData()
  }, [countryFilter])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [vecinosRes, countriesRes] = await Promise.all([
        vecinosApi.list(countryFilter ? { countryId: countryFilter } : undefined),
        countriesApi.list(),
      ])

      if (vecinosRes.success && vecinosRes.data) {
        const vecinosData = Array.isArray(vecinosRes.data)
          ? vecinosRes.data
          : (vecinosRes.data as any)?.data || vecinosRes.data
        if (Array.isArray(vecinosData)) {
          setVecinos(vecinosData)
        }
      }

      if (countriesRes.success && countriesRes.data) {
        const countriesData = Array.isArray(countriesRes.data)
          ? countriesRes.data
          : (countriesRes.data as any)?.data || countriesRes.data
        if (Array.isArray(countriesData)) {
          setCountries(countriesData)
        }
      }
    } catch (err) {
      setError("Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este vecino?")) return

    const response = await vecinosApi.delete(id)
    if (response.success) {
      fetchData()
    } else {
      alert(response.error || "Error al eliminar vecino")
    }
  }

  const columns: ColumnDef<VecinoData>[] = React.useMemo(
    () => [
      {
        accessorKey: "nombre",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2 hover:bg-transparent"
            >
              Nombre
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => (
          <div>
            <div className="font-medium">
              {row.original.nombre} {row.original.apellido}
            </div>
            {row.original.unidad && (
              <div className="text-sm text-muted-foreground">{row.original.unidad}</div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => <div>{row.original.email}</div>,
      },
      {
        accessorKey: "telefono",
        header: "Teléfono",
        cell: ({ row }) => <div>{row.original.telefono || "-"}</div>,
      },
      {
        accessorKey: "country.name",
        header: "Country",
        cell: ({ row }) => <div>{row.original.country.name}</div>,
      },
      {
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => {
          const vecino = row.original
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/vecinos/${vecino.id}`)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingVecinoId(vecino.id)
                  setFormOpen(true)
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(vecino.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )
        },
      },
    ],
    [router]
  )

  const table = useReactTable({
    data: vecinos,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: {
      sorting,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vecinos</h1>
          <p className="text-muted-foreground">
            Directorio de vecinos
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingVecinoId(undefined)
            setFormOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Vecino
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Vecinos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Input
              placeholder="Buscar por nombre, email..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-sm"
            />
            <Select
              value={countryFilter || undefined}
              onValueChange={(value) => setCountryFilter(value || "")}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.id} value={country.id}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setCountryFilter("")
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
                      <TableRow key={row.id}>
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
                        No hay vecinos.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando {table.getRowModel().rows.length} de {vecinos.length} vecinos
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

      <FormVecino
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingVecinoId(undefined)
        }}
        vecinoId={editingVecinoId}
        onSuccess={() => {
          fetchData()
        }}
      />
    </div>
  )
}
