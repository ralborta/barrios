"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { templatesApi } from "@/lib/api"
import { Plus, Edit, Trash2, FileText, MessageSquare, Mail, Phone } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Template {
  id: string
  nombre: string
  descripcion?: string
  tipo: string
  canal: string
  contenido: string
  asunto?: string
  variables?: string
  activo: boolean
  createdAt: string
  updatedAt: string
}

export default function TemplatesPage() {
  const [templates, setTemplates] = React.useState<Template[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingTemplate, setEditingTemplate] = React.useState<Template | null>(null)
  const [formData, setFormData] = React.useState({
    nombre: "",
    descripcion: "",
    tipo: "",
    canal: "",
    contenido: "",
    asunto: "",
    activo: true,
  })

  React.useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await templatesApi.list()
      if (response.success && response.data) {
        const templatesData = Array.isArray(response.data)
          ? response.data
          : (response.data as any)?.data || []
        setTemplates(Array.isArray(templatesData) ? templatesData : [])
      } else {
        setError(response.error || 'Error al cargar templates')
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar templates')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (template?: Template) => {
    if (template) {
      setEditingTemplate(template)
      setFormData({
        nombre: template.nombre,
        descripcion: template.descripcion || "",
        tipo: template.tipo,
        canal: template.canal,
        contenido: template.contenido,
        asunto: template.asunto || "",
        activo: template.activo,
      })
    } else {
      setEditingTemplate(null)
      setFormData({
        nombre: "",
        descripcion: "",
        tipo: "",
        canal: "",
        contenido: "",
        asunto: "",
        activo: true,
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingTemplate(null)
    setFormData({
      nombre: "",
      descripcion: "",
      tipo: "",
      canal: "",
      contenido: "",
      asunto: "",
      activo: true,
    })
  }

  const handleSubmit = async () => {
    try {
      setError(null)
      if (editingTemplate) {
        const response = await templatesApi.update(editingTemplate.id, formData)
        if (response.success) {
          handleCloseDialog()
          fetchTemplates()
        } else {
          setError(response.error || 'Error al actualizar template')
        }
      } else {
        const response = await templatesApi.create(formData)
        if (response.success) {
          handleCloseDialog()
          fetchTemplates()
        } else {
          setError(response.error || 'Error al crear template')
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al guardar template')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este template?')) return

    try {
      const response = await templatesApi.delete(id)
      if (response.success) {
        fetchTemplates()
      } else {
        setError(response.error || 'Error al eliminar template')
      }
    } catch (err: any) {
      setError(err.message || 'Error al eliminar template')
    }
  }

  const getCanalIcon = (canal: string) => {
    switch (canal) {
      case 'WHATSAPP':
        return <Phone className="h-4 w-4 text-green-500" />
      case 'EMAIL':
        return <Mail className="h-4 w-4 text-blue-500" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getTipoBadge = (tipo: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      EMISION: "default",
      RECORDATORIO_VENCIMIENTO: "secondary",
      SEGUIMIENTO: "outline",
      MORA: "destructive",
      RECUPERO: "destructive",
      CIERRE_MES: "secondary",
      MANUAL: "outline",
    }
    return variants[tipo] || "outline"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Templates de Mensajes</h1>
          <p className="text-slate-600 mt-1">
            Gestiona las plantillas de mensajes para WhatsApp y Email
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Template
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-indigo-50/30 border-b">
          <CardTitle className="text-slate-800">Templates ({templates.length})</CardTitle>
          <CardDescription className="text-slate-600">
            Plantillas con variables dinámicas como {`{nombre}`}, {`{monto}`}, {`{fechaVencimiento}`}, etc.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Cargando...</div>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay templates. Crea uno nuevo para empezar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Contenido</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.nombre}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getCanalIcon(template.canal)}
                        <span>{template.canal}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTipoBadge(template.tipo)}>
                        {template.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {template.contenido}
                    </TableCell>
                    <TableCell>
                      <Badge variant={template.activo ? "default" : "outline"}>
                        {template.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(template.id)}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Editar Template" : "Nuevo Template"}
            </DialogTitle>
            <DialogDescription>
              Crea una plantilla de mensaje con variables dinámicas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Recordatorio de Vencimiento"
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción del template"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Canal *</Label>
                <Select
                  value={formData.canal}
                  onValueChange={(value) => setFormData({ ...formData, canal: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona canal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                    <SelectItem value="EMAIL">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMISION">Emisión</SelectItem>
                    <SelectItem value="RECORDATORIO_VENCIMIENTO">Recordatorio</SelectItem>
                    <SelectItem value="SEGUIMIENTO">Seguimiento</SelectItem>
                    <SelectItem value="MORA">Mora</SelectItem>
                    <SelectItem value="RECUPERO">Recupero</SelectItem>
                    <SelectItem value="CIERRE_MES">Cierre de Mes</SelectItem>
                    <SelectItem value="MANUAL">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.canal === 'EMAIL' && (
              <div className="space-y-2">
                <Label>Asunto</Label>
                <Input
                  value={formData.asunto}
                  onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
                  placeholder="Asunto del email (puede usar variables como {nombre})"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Contenido *</Label>
              <Textarea
                value={formData.contenido}
                onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                placeholder={`Ejemplo:\nHola {nombre} {apellido},\n\nTu expensa de {periodo} por un monto de {monto} vence el {fechaVencimiento}.\n\nSaludos`}
                rows={8}
              />
              <p className="text-xs text-muted-foreground">
                Variables disponibles: {`{nombre}`}, {`{apellido}`}, {`{email}`}, {`{telefono}`}, {`{monto}`}, {`{fechaVencimiento}`}, {`{periodo}`}, {`{mes}`}, {`{anio}`}, {`{country}`}, {`{estado}`}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.nombre || !formData.canal || !formData.tipo || !formData.contenido}
            >
              {editingTemplate ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
