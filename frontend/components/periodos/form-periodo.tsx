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
import { periodosApi, countriesApi } from "@/lib/api"
import { format } from "date-fns"

const periodoSchema = z.object({
  countryId: z.string().min(1, "El country es requerido"),
  mes: z.number().min(1).max(12),
  anio: z.number().min(2020),
  montoBase: z.number().positive("El monto base debe ser mayor a 0"),
  fechaVencimiento: z.string().min(1, "La fecha de vencimiento es requerida"),
  fechaCierre: z.string().optional(),
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
