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
import { vecinosApi, countriesApi } from "@/lib/api"

const vecinoSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  apellido: z.string().min(1, "El apellido es requerido"),
  email: z.string().email("Email inválido"),
  telefono: z.string().optional(),
  unidad: z.string().optional(),
  countryId: z.string().min(1, "El country es requerido"),
  observaciones: z.string().optional(),
})

type VecinoFormData = z.infer<typeof vecinoSchema>

interface FormVecinoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vecinoId?: string
  onSuccess?: () => void
}

export function FormVecino({ open, onOpenChange, vecinoId, onSuccess }: FormVecinoProps) {
  const [loading, setLoading] = React.useState(false)
  const [countries, setCountries] = React.useState<{ id: string; name: string }[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<VecinoFormData>({
    resolver: zodResolver(vecinoSchema),
  })

  React.useEffect(() => {
    fetchCountries()
    if (vecinoId) {
      fetchVecino()
    } else {
      reset()
    }
  }, [vecinoId, open])

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

  const fetchVecino = async () => {
    if (!vecinoId) return
    setLoading(true)
    const response = await vecinosApi.get(vecinoId)
    if (response.success && response.data) {
      const vecino = Array.isArray(response.data)
        ? response.data[0]
        : (response.data as any)?.data || response.data
      if (vecino) {
        reset({
          nombre: vecino.nombre,
          apellido: vecino.apellido,
          email: vecino.email,
          telefono: vecino.telefono || "",
          unidad: vecino.unidad || "",
          countryId: vecino.countryId,
          observaciones: vecino.observaciones || "",
        })
      }
    }
    setLoading(false)
  }

  const onSubmit = async (data: VecinoFormData) => {
    setLoading(true)
    try {
      let response
      if (vecinoId) {
        response = await vecinosApi.update(vecinoId, data)
      } else {
        response = await vecinosApi.create(data)
      }

      if (response.success) {
        onOpenChange(false)
        reset()
        onSuccess?.()
      } else {
        alert(response.error || "Error al guardar vecino")
      }
    } catch (error) {
      alert("Error al guardar vecino")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{vecinoId ? "Editar Vecino" : "Nuevo Vecino"}</DialogTitle>
          <DialogDescription>
            {vecinoId
              ? "Modifica los datos del vecino"
              : "Completa los datos para crear un nuevo vecino"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                {...register("nombre")}
                placeholder="Juan"
                disabled={loading}
              />
              {errors.nombre && (
                <p className="text-sm text-destructive">{errors.nombre.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido *</Label>
              <Input
                id="apellido"
                {...register("apellido")}
                placeholder="Pérez"
                disabled={loading}
              />
              {errors.apellido && (
                <p className="text-sm text-destructive">{errors.apellido.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="juan@example.com"
              disabled={loading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                {...register("telefono")}
                placeholder="+54 11 1234-5678"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unidad">Unidad</Label>
              <Input
                id="unidad"
                {...register("unidad")}
                placeholder="Casa 12"
                disabled={loading}
              />
            </div>
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Input
              id="observaciones"
              {...register("observaciones")}
              placeholder="Notas adicionales..."
              disabled={loading}
            />
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
              {loading ? "Guardando..." : vecinoId ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
