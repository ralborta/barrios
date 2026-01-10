"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { expensasApi, periodosApi, vecinosApi } from "@/lib/api"
import { format } from "date-fns"
import { FileText, Download, Upload, Trash2 } from "lucide-react"

const expensaSchema = z.object({
  periodoId: z.string().min(1, "El período es requerido"),
  vecinoId: z.string().min(1, "El vecino es requerido"),
  monto: z.number().positive("El monto debe ser mayor a 0"),
  estado: z.enum([
    "PENDIENTE",
    "PAGO_INFORMADO",
    "CONFIRMADO",
    "EN_MORA",
    "EN_RECUPERO",
    "SIN_RESPUESTA",
    "PAUSADO",
  ]).optional(),
  fechaVencimiento: z.string().min(1, "La fecha de vencimiento es requerida"),
})

type ExpensaFormData = z.infer<typeof expensaSchema>

interface FormExpensaProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expensaId?: string
  periodoId?: string
  onSuccess?: () => void
}

export function FormExpensa({ open, onOpenChange, expensaId, periodoId, onSuccess }: FormExpensaProps) {
  const [loading, setLoading] = React.useState(false)
  const [periodos, setPeriodos] = React.useState<{ id: string; mes: number; anio: number; country: { name: string } }[]>([])
  const [vecinos, setVecinos] = React.useState<{ id: string; nombre: string; apellido: string }[]>([])
  const [boleta, setBoleta] = React.useState<{ url: string | null; nombreArchivo: string | null } | null>(null)
  const [uploadFile, setUploadFile] = React.useState<File | null>(null)
  const [uploadingBoleta, setUploadingBoleta] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ExpensaFormData>({
    resolver: zodResolver(expensaSchema),
  })

  React.useEffect(() => {
    fetchPeriodos()
    fetchVecinos()
    if (expensaId) {
      fetchExpensa()
    } else {
      reset({
        periodoId: periodoId || "",
        fechaVencimiento: format(new Date(), "yyyy-MM-dd"),
      })
    }
  }, [expensaId, periodoId, open])

  const fetchPeriodos = async () => {
    const response = await periodosApi.list()
    if (response.success && response.data) {
      const periodosData = Array.isArray(response.data)
        ? response.data
        : (response.data as any)?.data || response.data
      if (Array.isArray(periodosData)) {
        setPeriodos(periodosData)
      }
    }
  }

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

  const fetchExpensa = async () => {
    if (!expensaId) return
    setLoading(true)
    const response = await expensasApi.get(expensaId)
    if (response.success && response.data) {
      const expensa = Array.isArray(response.data)
        ? response.data[0]
        : (response.data as any)?.data || response.data
      if (expensa) {
        reset({
          periodoId: expensa.periodoId,
          vecinoId: expensa.vecinoId,
          monto: expensa.monto,
          estado: expensa.estado || "PENDIENTE",
          fechaVencimiento: format(new Date(expensa.fechaVencimiento), "yyyy-MM-dd"),
        })
        // Cargar información de boleta si existe
        if (expensa.boletaUrl) {
          setBoleta({
            url: expensa.boletaUrl,
            nombreArchivo: expensa.boletaNombreArchivo || null,
          })
        } else {
          setBoleta(null)
        }
      }
    }
    setLoading(false)
  }

  const onSubmit = async (data: ExpensaFormData) => {
    setLoading(true)
    try {
      const payload = {
        ...data,
        fechaVencimiento: new Date(data.fechaVencimiento).toISOString(),
      }

      let response
      if (expensaId) {
        response = await expensasApi.update(expensaId, payload)
      } else {
        response = await expensasApi.create(payload)
      }

      if (response.success) {
        onOpenChange(false)
        reset()
        onSuccess?.()
      } else {
        alert(response.error || "Error al guardar expensa")
      }
    } catch (error) {
      alert("Error al guardar expensa")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{expensaId ? "Editar Expensa" : "Nueva Expensa"}</DialogTitle>
          <DialogDescription>
            {expensaId
              ? "Modifica los datos de la expensa"
              : "Completa los datos para crear una nueva expensa"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="periodoId">Período *</Label>
            <Select
              value={watch("periodoId") || ""}
              onValueChange={(value) => setValue("periodoId", value)}
              disabled={loading || !!periodoId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un período" />
              </SelectTrigger>
              <SelectContent>
                {periodos.map((periodo) => (
                  <SelectItem key={periodo.id} value={periodo.id}>
                    {periodo.mes}/{periodo.anio} - {periodo.country?.name || ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.periodoId && (
              <p className="text-sm text-destructive">{errors.periodoId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="vecinoId">Vecino *</Label>
            <Select
              value={watch("vecinoId") || ""}
              onValueChange={(value) => setValue("vecinoId", value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un vecino" />
              </SelectTrigger>
              <SelectContent>
                {vecinos.map((vecino) => (
                  <SelectItem key={vecino.id} value={vecino.id}>
                    {vecino.nombre} {vecino.apellido}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.vecinoId && (
              <p className="text-sm text-destructive">{errors.vecinoId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monto">Monto *</Label>
              <Input
                id="monto"
                type="number"
                step="0.01"
                {...register("monto", { valueAsNumber: true })}
                placeholder="0.00"
                disabled={loading}
              />
              {errors.monto && (
                <p className="text-sm text-destructive">{errors.monto.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fechaVencimiento">Fecha Vencimiento *</Label>
              <Input
                id="fechaVencimiento"
                type="date"
                {...register("fechaVencimiento")}
                disabled={loading}
              />
              {errors.fechaVencimiento && (
                <p className="text-sm text-destructive">{errors.fechaVencimiento.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Select
              value={watch("estado") || "PENDIENTE"}
              onValueChange={(value) => setValue("estado", value as any)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                <SelectItem value="PAGO_INFORMADO">Pago Informado</SelectItem>
                <SelectItem value="CONFIRMADO">Confirmado</SelectItem>
                <SelectItem value="EN_MORA">En Mora</SelectItem>
                <SelectItem value="EN_RECUPERO">En Recupero</SelectItem>
                <SelectItem value="SIN_RESPUESTA">Sin Respuesta</SelectItem>
                <SelectItem value="PAUSADO">Pausado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sección de Boleta */}
          {expensaId && (
            <div className="space-y-2 border-t pt-4">
              <Label>Boleta</Label>
              {boleta?.url ? (
                <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{boleta.nombreArchivo || "boleta.pdf"}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (!expensaId) return
                        try {
                          const response = await expensasApi.downloadBoleta(expensaId)
                          if (!response.ok) throw new Error("Error al descargar")
                          const blob = await response.blob()
                          const url = window.URL.createObjectURL(blob)
                          const a = document.createElement("a")
                          a.href = url
                          a.download = boleta.nombreArchivo || "boleta.pdf"
                          document.body.appendChild(a)
                          a.click()
                          window.URL.revokeObjectURL(url)
                          document.body.removeChild(a)
                        } catch (error) {
                          alert("Error al descargar boleta")
                        }
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (!confirm("¿Estás seguro de eliminar esta boleta?")) return
                        if (!expensaId) return
                        try {
                          const response = await expensasApi.deleteBoleta(expensaId)
                          if (response.success) {
                            setBoleta(null)
                            alert("Boleta eliminada correctamente")
                          } else {
                            alert(response.error || "Error al eliminar boleta")
                          }
                        } catch (error) {
                          alert("Error al eliminar boleta")
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    disabled={loading || uploadingBoleta}
                  />
                  {uploadFile && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (!uploadFile || !expensaId) return
                        setUploadingBoleta(true)
                        try {
                          const response = await expensasApi.uploadBoleta(expensaId, uploadFile)
                          if (response.success) {
                            setBoleta({
                              url: (response.data as any)?.boletaUrl || null,
                              nombreArchivo: (response.data as any)?.boletaNombreArchivo || null,
                            })
                            setUploadFile(null)
                            alert("Boleta subida correctamente")
                          } else {
                            alert(response.error || "Error al subir boleta")
                          }
                        } catch (error) {
                          alert("Error al subir boleta")
                        } finally {
                          setUploadingBoleta(false)
                        }
                      }}
                      disabled={uploadingBoleta}
                    >
                      {uploadingBoleta ? "Subiendo..." : <><Upload className="h-4 w-4 mr-2" />Subir Boleta</>}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : expensaId ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
