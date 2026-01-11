"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { expensasApi, periodosApi, vecinosApi } from "@/lib/api"
import { Upload, Download, Trash2, FileText, Search } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface BoletaData {
  id: string
  monto: number
  estado: string
  fechaVencimiento: string
  boletaUrl: string | null
  boletaNombreArchivo: string | null
  boletaTipoArchivo: string | null
  vecino: {
    id: string
    nombre: string
    apellido: string
    email: string
  }
  periodo: {
    id: string
    mes: number
    anio: number
    country: {
      name: string
    }
  }
}

export default function BoletasPage() {
  const [boletas, setBoletas] = React.useState<BoletaData[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false)
  const [selectedExpensaId, setSelectedExpensaId] = React.useState<string>("")
  const [uploadFile, setUploadFile] = React.useState<File | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const [expensas, setExpensas] = React.useState<BoletaData[]>([])

  React.useEffect(() => {
    fetchBoletas()
  }, [])

  const fetchBoletas = async () => {
    setLoading(true)
    try {
      const response = await expensasApi.list()
      if (response.success && response.data) {
        const expensasData = Array.isArray(response.data)
          ? response.data
          : (response.data as any)?.data || response.data
        if (Array.isArray(expensasData)) {
          setBoletas(expensasData)
          setExpensas(expensasData)
        }
      }
    } catch (error) {
      console.error("Error al cargar boletas:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!uploadFile || !selectedExpensaId) {
      alert("Por favor, selecciona un archivo y una expensa")
      return
    }

    setUploading(true)
    try {
      const response = await expensasApi.uploadBoleta(selectedExpensaId, uploadFile)
      
      if (response.success) {
        setUploadDialogOpen(false)
        setUploadFile(null)
        setSelectedExpensaId("")
        fetchBoletas()
        alert("Boleta subida correctamente")
      } else {
        alert(response.error || "Error al subir boleta")
      }
    } catch (err: any) {
      alert(err.message || "Error al subir boleta")
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (expensaId: string, fileName: string) => {
    try {
      const response = await expensasApi.downloadBoleta(expensaId)
      if (!response.ok) {
        throw new Error("Error al descargar boleta")
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName || "boleta.pdf"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error al descargar boleta:", error)
      alert("Error al descargar boleta")
    }
  }

  const handleDelete = async (expensaId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta boleta?")) return

    try {
      const response = await expensasApi.deleteBoleta(expensaId)
      if (response.success) {
        fetchBoletas()
        alert("Boleta eliminada correctamente")
      } else {
        alert(response.error || "Error al eliminar boleta")
      }
    } catch (error) {
      console.error("Error al eliminar boleta:", error)
      alert("Error al eliminar boleta")
    }
  }

  const boletasFiltradas = (Array.isArray(boletas) ? boletas : []).filter((boleta) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      boleta.vecino.nombre.toLowerCase().includes(search) ||
      boleta.vecino.apellido.toLowerCase().includes(search) ||
      boleta.vecino.email.toLowerCase().includes(search) ||
      boleta.periodo.country.name.toLowerCase().includes(search) ||
      boleta.boletaNombreArchivo?.toLowerCase().includes(search)
    )
  })

  const boletasConArchivo = boletasFiltradas.filter((b) => b.boletaUrl)
  const boletasSinArchivo = boletasFiltradas.filter((b) => !b.boletaUrl)

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      PENDIENTE: "default",
      PAGO_INFORMADO: "secondary",
      CONFIRMADO: "default",
      EN_MORA: "destructive",
      EN_RECUPERO: "outline",
      SIN_RESPUESTA: "secondary",
      PAUSADO: "outline",
    }
    return variants[estado] || "default"
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Boletas de Expensas</h1>
          <p className="text-slate-600 mt-1">
            Gestiona las boletas y facturas de las expensas
          </p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)} className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-md">
          <Upload className="mr-2 h-4 w-4" />
          Subir Boleta
        </Button>
      </div>

      {/* Buscador */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-orange-50/30 border-b">
          <CardTitle className="text-slate-800">Buscar Boletas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por vecino, email, country o nombre de archivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Boletas con archivo */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-orange-50/30 border-b">
          <CardTitle className="text-slate-800">Boletas con Archivo ({boletasConArchivo.length})</CardTitle>
          <CardDescription>
            Expensas que tienen boleta asociada
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : boletasConArchivo.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay boletas con archivo
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vecino</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Archivo</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {boletasConArchivo.map((boleta) => (
                  <TableRow key={boleta.id}>
                    <TableCell>
                      {boleta.vecino.nombre} {boleta.vecino.apellido}
                      <br />
                      <span className="text-xs text-muted-foreground">
                        {boleta.vecino.email}
                      </span>
                    </TableCell>
                    <TableCell>
                      {boleta.periodo.mes}/{boleta.periodo.anio}
                    </TableCell>
                    <TableCell>{boleta.periodo.country.name}</TableCell>
                    <TableCell>
                      ${Number(boleta.monto).toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getEstadoBadge(boleta.estado)}>
                        {boleta.estado.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(boleta.fechaVencimiento), "dd/MM/yyyy", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{boleta.boletaNombreArchivo}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDownload(boleta.id, boleta.boletaNombreArchivo || "boleta.pdf")
                          }
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(boleta.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Boletas sin archivo */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-orange-50/30 border-b">
          <CardTitle className="text-slate-800">Expensas sin Boleta ({boletasSinArchivo.length})</CardTitle>
          <CardDescription>
            Expensas que aún no tienen boleta asociada
          </CardDescription>
        </CardHeader>
        <CardContent>
          {boletasSinArchivo.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Todas las expensas tienen boleta asociada
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vecino</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {boletasSinArchivo.map((boleta) => (
                  <TableRow key={boleta.id}>
                    <TableCell>
                      {boleta.vecino.nombre} {boleta.vecino.apellido}
                      <br />
                      <span className="text-xs text-muted-foreground">
                        {boleta.vecino.email}
                      </span>
                    </TableCell>
                    <TableCell>
                      {boleta.periodo.mes}/{boleta.periodo.anio}
                    </TableCell>
                    <TableCell>{boleta.periodo.country.name}</TableCell>
                    <TableCell>
                      ${Number(boleta.monto).toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getEstadoBadge(boleta.estado)}>
                        {boleta.estado.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(boleta.fechaVencimiento), "dd/MM/yyyy", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedExpensaId(boleta.id)
                          setUploadDialogOpen(true)
                        }}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Subir Boleta
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog para subir boleta */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Subir Boleta</DialogTitle>
            <DialogDescription>
              Selecciona el archivo de la boleta (PDF, JPG, PNG)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="expensa">Expensa</Label>
              <select
                id="expensa"
                value={selectedExpensaId}
                onChange={(e) => setSelectedExpensaId(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md"
                disabled={!!selectedExpensaId}
              >
                <option value="">Selecciona una expensa</option>
                {expensas.map((exp) => (
                  <option key={exp.id} value={exp.id}>
                    {exp.vecino.nombre} {exp.vecino.apellido} - {exp.periodo.mes}/{exp.periodo.anio} - ${Number(exp.monto).toLocaleString("es-AR")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="file">Archivo</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUploadDialogOpen(false)
                setUploadFile(null)
                setSelectedExpensaId("")
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!uploadFile || !selectedExpensaId || uploading}
            >
              {uploading ? "Subiendo..." : "Subir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
