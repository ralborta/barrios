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
import { Checkbox } from "@/components/ui/checkbox"
import { periodosApi, countriesApi } from "@/lib/api"
import { format } from "date-fns"
import { Separator } from "@/components/ui/separator"

const periodoSchema = z.object({
  countryId: z.string().min(1, "El country es requerido"),
  mes: z.number().min(1).max(12),
  anio: z.number().min(2020),
  montoBase: z.number().positive("El monto base debe ser mayor a 0"),
  fechaVencimiento: z.string().min(1, "La fecha de vencimiento es requerida"),
  fechaCierre: z.string().optional(),
  // Configuración de cronjobs
  diasRecordatorioAntes: z.number().min(0).max(30).optional(),
  diasMora: z.number().min(0).max(30).optional(),
  frecuenciaSeguimiento: z.number().min(1).max(30).optional(),
  maxSeguimientos: z.number().min(1).max(10).optional(),
  canalesRecordatorio: z.string().optional(),
  canalesSeguimiento: z.string().optional(),
  habilitarRecordatorios: z.boolean().optional(),
  habilitarSeguimientos: z.boolean().optional(),
})

type PeriodoFormData = z.infer<typeof periodoSchema>

interface FormPeriodoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  periodoId?: string
  onSuccess?: () => void
}

const meses = [
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" },
]

export function FormPeriodo({ open, onOpenChange, periodoId, onSuccess }: FormPeriodoProps) {
  const [loading, setLoading] = React.useState(false)
  const [countries, setCountries] = React.useState<{ id: string; name: string }[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<PeriodoFormData>({
    resolver: zodResolver(periodoSchema),
  })

  React.useEffect(() => {
    fetchCountries()
    if (periodoId) {
      fetchPeriodo()
    } else {
      const now = new Date()
      reset({
        mes: now.getMonth() + 1,
        anio: now.getFullYear(),
        fechaVencimiento: format(new Date(now.getFullYear(), now.getMonth() + 1, 10), "yyyy-MM-dd"),
        diasRecordatorioAntes: 3,
        diasMora: 1,
        frecuenciaSeguimiento: 7,
        maxSeguimientos: 3,
        canalesRecordatorio: "WHATSAPP",
        canalesSeguimiento: "WHATSAPP",
        habilitarRecordatorios: true,
        habilitarSeguimientos: true,
      })
    }
  }, [periodoId, open])

  const fetchCountries = async () => {
    const response = await countriesApi.list()
    if (response.success && response.data) {
      const countriesData = Array.isArray(response.data)
        ? response.data
        : (response.data as any)?.data || response.data
      if (Array.isArray(countriesData)) {
        setCountries(countriesData)
      }
    }
  }

  const fetchPeriodo = async () => {
    if (!periodoId) return
    setLoading(true)
    const response = await periodosApi.get(periodoId)
    if (response.success && response.data) {
      const periodo = Array.isArray(response.data)
        ? response.data[0]
        : (response.data as any)?.data || response.data
      if (periodo) {
        reset({
          countryId: periodo.countryId,
          mes: periodo.mes,
          anio: periodo.anio,
          montoBase: periodo.montoBase,
          fechaVencimiento: format(new Date(periodo.fechaVencimiento), "yyyy-MM-dd"),
          fechaCierre: periodo.fechaCierre
            ? format(new Date(periodo.fechaCierre), "yyyy-MM-dd")
            : "",
          diasRecordatorioAntes: periodo.diasRecordatorioAntes ?? 3,
          diasMora: periodo.diasMora ?? 1,
          frecuenciaSeguimiento: periodo.frecuenciaSeguimiento ?? 7,
          maxSeguimientos: periodo.maxSeguimientos ?? 3,
          canalesRecordatorio: periodo.canalesRecordatorio ?? "WHATSAPP",
          canalesSeguimiento: periodo.canalesSeguimiento ?? "WHATSAPP",
          habilitarRecordatorios: periodo.habilitarRecordatorios ?? true,
          habilitarSeguimientos: periodo.habilitarSeguimientos ?? true,
        })
      }
    }
    setLoading(false)
  }

  const onSubmit = async (data: PeriodoFormData) => {
    setLoading(true)
    try {
      const payload = {
        ...data,
        fechaVencimiento: new Date(data.fechaVencimiento).toISOString(),
        fechaCierre: data.fechaCierre ? new Date(data.fechaCierre).toISOString() : undefined,
      }

      let response
      if (periodoId) {
        response = await periodosApi.update(periodoId, payload)
      } else {
        response = await periodosApi.create(payload)
      }

      if (response.success) {
        onOpenChange(false)
        reset()
        onSuccess?.()
      } else {
        alert(response.error || "Error al guardar período")
      }
    } catch (error) {
      alert("Error al guardar período")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{periodoId ? "Editar Período" : "Nuevo Período"}</DialogTitle>
          <DialogDescription>
            {periodoId
              ? "Modifica los datos del período"
              : "Completa los datos para crear un nuevo período"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="countryId">Country *</Label>
            <Select
              value={watch("countryId") || ""}
              onValueChange={(value) => setValue("countryId", value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.id} value={country.id}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.countryId && (
              <p className="text-sm text-destructive">{errors.countryId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mes">Mes *</Label>
              <Select
                value={watch("mes")?.toString() || ""}
                onValueChange={(value) => setValue("mes", parseInt(value))}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un mes" />
                </SelectTrigger>
                <SelectContent>
                  {meses.map((mes) => (
                    <SelectItem key={mes.value} value={mes.value.toString()}>
                      {mes.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.mes && (
                <p className="text-sm text-destructive">{errors.mes.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="anio">Año *</Label>
              <Input
                id="anio"
                type="number"
                {...register("anio", { valueAsNumber: true })}
                placeholder="2026"
                min="2020"
                disabled={loading}
              />
              {errors.anio && (
                <p className="text-sm text-destructive">{errors.anio.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="montoBase">Monto Base *</Label>
            <Input
              id="montoBase"
              type="number"
              step="0.01"
              {...register("montoBase", { valueAsNumber: true })}
              placeholder="0.00"
              disabled={loading}
            />
            {errors.montoBase && (
              <p className="text-sm text-destructive">{errors.montoBase.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="fechaCierre">Fecha Cierre</Label>
              <Input
                id="fechaCierre"
                type="date"
                {...register("fechaCierre")}
                disabled={loading}
              />
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Configuración de Automatización</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Configura los parámetros para los recordatorios y seguimientos automáticos
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="habilitarRecordatorios"
                  checked={watch("habilitarRecordatorios") ?? true}
                  onCheckedChange={(checked) => setValue("habilitarRecordatorios", checked as boolean)}
                  disabled={loading}
                />
                <Label htmlFor="habilitarRecordatorios" className="font-normal cursor-pointer">
                  Habilitar recordatorios automáticos
                </Label>
              </div>

              {watch("habilitarRecordatorios") && (
                <div className="grid grid-cols-2 gap-4 ml-6">
                  <div className="space-y-2">
                    <Label htmlFor="diasRecordatorioAntes">Días antes del vencimiento</Label>
                    <Input
                      id="diasRecordatorioAntes"
                      type="number"
                      min="0"
                      max="30"
                      {...register("diasRecordatorioAntes", { valueAsNumber: true })}
                      placeholder="3"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="canalesRecordatorio">Canales</Label>
                    <Select
                      value={watch("canalesRecordatorio") || "WHATSAPP"}
                      onValueChange={(value) => setValue("canalesRecordatorio", value)}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                        <SelectItem value="EMAIL">Email</SelectItem>
                        <SelectItem value="WHATSAPP,EMAIL">WhatsApp y Email</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="diasMora">Días después del vencimiento para cambiar a MORA</Label>
                <Input
                  id="diasMora"
                  type="number"
                  min="0"
                  max="30"
                  {...register("diasMora", { valueAsNumber: true })}
                  placeholder="1"
                  disabled={loading}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="habilitarSeguimientos"
                  checked={watch("habilitarSeguimientos") ?? true}
                  onCheckedChange={(checked) => setValue("habilitarSeguimientos", checked as boolean)}
                  disabled={loading}
                />
                <Label htmlFor="habilitarSeguimientos" className="font-normal cursor-pointer">
                  Habilitar seguimientos automáticos
                </Label>
              </div>

              {watch("habilitarSeguimientos") && (
                <div className="grid grid-cols-2 gap-4 ml-6">
                  <div className="space-y-2">
                    <Label htmlFor="frecuenciaSeguimiento">Frecuencia (días)</Label>
                    <Input
                      id="frecuenciaSeguimiento"
                      type="number"
                      min="1"
                      max="30"
                      {...register("frecuenciaSeguimiento", { valueAsNumber: true })}
                      placeholder="7"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxSeguimientos">Máximo de seguimientos</Label>
                    <Input
                      id="maxSeguimientos"
                      type="number"
                      min="1"
                      max="10"
                      {...register("maxSeguimientos", { valueAsNumber: true })}
                      placeholder="3"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="canalesSeguimiento">Canales</Label>
                    <Select
                      value={watch("canalesSeguimiento") || "WHATSAPP"}
                      onValueChange={(value) => setValue("canalesSeguimiento", value)}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                        <SelectItem value="EMAIL">Email</SelectItem>
                        <SelectItem value="WHATSAPP,EMAIL">WhatsApp y Email</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </div>

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
              {loading ? "Guardando..." : periodoId ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
