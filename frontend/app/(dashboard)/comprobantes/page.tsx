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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  Eye,
  Check,
  X,
  FileText,
  Download,
  Filter,
  ArrowUpDown,
  Upload,
  Plus,
} from "lucide-react"
import { comprobantesApi, vecinosApi, expensasApi } from "@/lib/api"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface ComprobanteData {
  id: string
  vecinoId: string
  expensaId?: string
  url: string
  nombreArchivo: string
  tipoArchivo: string
  estado: string
  observaciones?: string
  createdAt: string
  vecino: {
    id: string
    nombre: string
    apellido: string
    email: string
  }
  expensa?: {
    id: string
    monto: number
    estado: string
    periodo: {
      mes: number
      anio: number
      country: {
        name: string
      }
    }
  }
}

const getEstadoBadge = (estado: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    NUEVO: "outline",
    REVISADO: "secondary",
    CONFIRMADO: "default",
    RECHAZADO: "destructive",
  }
  return variants[estado] || "outline"
}

const estados = [
  { value: "NUEVO", label: "Nuevo" },
  { value: "REVISADO", label: "Revisado" },
  { value: "CONFIRMADO", label: "Confirmado" },
  { value: "RECHAZADO", label: "Rechazado" },
]

export default function ComprobantesPage() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [estadoFilter, setEstadoFilter] = React.useState<string>("")
  const [comprobantes, setComprobantes] = React.useState<ComprobanteData[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false)
  const [uploadFile, setUploadFile] = React.useState<File | null>(null)
  const [uploadVecinoId, setUploadVecinoId] = React.useState<string>("")
  const [uploadExpensaId, setUploadExpensaId] = React.useState<string>("")
  const [uploading, setUploading] = React.useState(false)
  const [vecinos, setVecinos] = React.useState<Array<{ id: string; nombre: string; apellido: string; email: string }>>([])
  const [expensas, setExpensas] = React.useState<Array<{ id: string; monto: number; periodo: { mes: number; anio: number; country: { name: string } } }>>([])

  React.useEffect(() => {
    fetchComprobantes()
  }, [estadoFilter])

  React.useEffect(() => {
    if (uploadDialogOpen) {
      fetchVecinos()
      if (uploadVecinoId) {
        fetchExpensas(uploadVecinoId)
      }
    }
  }, [uploadDialogOpen, uploadVecinoId])

  const fetchVecinos = async () => {
    const response = await vecinosApi.list()
    if (response.success && response.data) {
      const vecinosData = Array.isArray(response.data)
        ? response.data
        : (response.data as any)?.data || response.data
      if (Array.isArray(vecinosData)) {
        setVecinos(vecinosData)
      }
    }
  }

  const fetchExpensas = async (vecinoId: string) => {
    const response = await expensasApi.list({ vecinoId })
    if (response.success && response.data) {
      const expensasData = Array.isArray(response.data)
        ? response.data
        : (response.data as any)?.data || response.data
      if (Array.isArray(expensasData)) {
        setExpensas(expensasData)
      }
    }
  }

  const handleUpload = async () => {
    if (!uploadFile || !uploadVecinoId) {
      alert('Por favor, selecciona un archivo y un vecino')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('vecinoId', uploadVecinoId)
      if (uploadExpensaId) {
        formData.append('expensaId', uploadExpensaId)
      }

      const response = await comprobantesApi.create(formData)
      
      if (response.success) {
        setUploadDialogOpen(false)
        setUploadFile(null)
        setUploadVecinoId("")
        setUploadExpensaId("")
        fetchComprobantes()
      } else {
        alert(response.error || 'Error al subir el comprobante')
      }
    } catch (err: any) {
      alert(err.message || 'Error al subir el comprobante')
    } finally {
      setUploading(false)
    }
  }

  const fetchComprobantes = async () => {
    setLoading(true)
    setError(null)

    const params = estadoFilter ? { estado: estadoFilter } : undefined
    const response = await comprobantesApi.list(params)

    if (response.success && response.data) {
      // El backend devuelve { success: true, data: comprobantes }
      // El cliente API lo envuelve, así que response.data puede ser el objeto completo
      const comprobantesData = Array.isArray(response.data) 
        ? response.data 
        : (response.data as any)?.data || response.data;
      
      if (Array.isArray(comprobantesData)) {
        setComprobantes(comprobantesData as ComprobanteData[])
      } else {
        setError("Formato de respuesta inválido")
      }
    } else {
      setError(response.error || "Error al cargar comprobantes")
    }

    setLoading(false)
  }

  const handleEstadoChange = async (id: string, nuevoEstado: string) => {
    const response = await comprobantesApi.update(id, { estado: nuevoEstado })
    if (response.success) {
      fetchComprobantes()
    } else {
      alert(response.error || "Error al actualizar estado")
    }
  }

  const handlePreview = (url: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
    setPreviewUrl(`${apiUrl}${url}`)
  }

  const columns: ColumnDef<ComprobanteData>[] = React.useMemo(
    () => [
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
            <div className="text-sm text-muted-foreground">{row.original.vecino.email}</div>
          </div>
        ),
      },
      {
        accessorKey: "nombreArchivo",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2 hover:bg-transparent"
            >
              Archivo
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{row.original.nombreArchivo}</div>
              <div className="text-xs text-muted-foreground">{row.original.tipoArchivo}</div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "expensa",
        header: "Expensa",
        cell: ({ row }) => {
          const expensa = row.original.expensa
          if (!expensa) {
            return <span className="text-muted-foreground">Sin vincular</span>
          }
          return (
            <div>
              <div className="font-medium">
                {expensa.periodo.mes}/{expensa.periodo.anio} - {expensa.periodo.country.name}
              </div>
              <div className="text-sm text-muted-foreground">
                ${expensa.monto.toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
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
          return <Badge variant={getEstadoBadge(estado)}>{estado}</Badge>
        },
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2 hover:bg-transparent"
            >
              Fecha
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => {
          const fecha = new Date(row.getValue("createdAt"))
          return format(fecha, "dd/MM/yyyy HH:mm", { locale: es })
        },
      },
      {
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => {
          const comprobante = row.original
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePreview(comprobante.url)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
                  window.open(`${apiUrl}${comprobante.url}`, "_blank")
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Select
                value={comprobante.estado}
                onValueChange={(value) => handleEstadoChange(comprobante.id, value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {estados.slice(1).map((estado) => (
                    <SelectItem key={estado.value} value={estado.value}>
                      {estado.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data: comprobantes,
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

  const comprobantesNuevos = comprobantes.filter((c) => c.estado === "NUEVO").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bandeja de Comprobantes</h1>
          <p className="text-muted-foreground">
            Gestiona los comprobantes recibidos de los vecinos
          </p>
        </div>
        <div className="flex items-center gap-4">
          {comprobantesNuevos > 0 && (
            <Badge variant="destructive" className="text-lg px-4 py-2">
              {comprobantesNuevos} nuevo{comprobantesNuevos !== 1 ? "s" : ""}
            </Badge>
          )}
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Subir Comprobante
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Comprobantes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Input
              placeholder="Buscar por vecino, archivo..."
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
                        No hay comprobantes.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando {table.getRowModel().rows.length} de {comprobantes.length} comprobantes
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

      {/* Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="bg-white rounded-lg p-4 max-w-4xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Vista Previa</h3>
              <Button variant="ghost" size="sm" onClick={() => setPreviewUrl(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {previewUrl.endsWith(".pdf") ? (
              <iframe src={previewUrl} className="w-full h-[80vh]" />
            ) : (
              <img src={previewUrl} alt="Preview" className="max-w-full h-auto" />
            )}
          </div>
        </div>
      )}

      {/* Dialog de carga de comprobante */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Subir Comprobante</DialogTitle>
            <DialogDescription>
              Selecciona un archivo y asócialo a un vecino
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vecino">Vecino *</Label>
              <Select value={uploadVecinoId} onValueChange={(value) => {
                setUploadVecinoId(value)
                setUploadExpensaId("")
                if (value) {
                  fetchExpensas(value)
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un vecino" />
                </SelectTrigger>
                <SelectContent>
                  {vecinos.map((vecino) => (
                    <SelectItem key={vecino.id} value={vecino.id}>
                      {vecino.nombre} {vecino.apellido} ({vecino.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {uploadVecinoId && expensas.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="expensa">Expensa (Opcional)</Label>
                <Select value={uploadExpensaId} onValueChange={setUploadExpensaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una expensa (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {expensas.map((expensa) => (
                      <SelectItem key={expensa.id} value={expensa.id}>
                        {expensa.periodo.mes}/{expensa.periodo.anio} - {expensa.periodo.country.name} - ${expensa.monto.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="file">Archivo *</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.gif"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                disabled={uploading}
              />
              {uploadFile && (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {uploadFile.name} ({(uploadFile.size / 1024).toFixed(2)} KB)
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUploadDialogOpen(false)
                setUploadFile(null)
                setUploadVecinoId("")
                setUploadExpensaId("")
              }}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={!uploadFile || !uploadVecinoId || uploading}>
              {uploading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Subir
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
