"use client"

import * as React from "react"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { mensajesApi, templatesApi, vecinosApi, expensasApi } from "@/lib/api"
import { Loader2, Users, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DialogEnviarMensajeProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vecinoId?: string // Si se proporciona, pre-selecciona este vecino
  expensaId?: string // Si se proporciona, pre-selecciona esta expensa
  onSuccess?: () => void
}

export function DialogEnviarMensaje({
  open,
  onOpenChange,
  vecinoId: initialVecinoId,
  expensaId: initialExpensaId,
  onSuccess,
}: DialogEnviarMensajeProps) {
  // Función simple de toast (reemplazar con useToast cuando esté disponible)
  const toast = (options: { title?: string; description?: string; variant?: "destructive" | "default" }) => {
    if (options.variant === "destructive") {
      alert(`Error: ${options.description || options.title}`)
    } else {
      alert(options.description || options.title || "Operación exitosa")
    }
  }
  const [modo, setModo] = React.useState<"individual" | "batch">(initialVecinoId ? "individual" : "batch")
  const [loading, setLoading] = React.useState(false)
  const [cargandoVecinos, setCargandoVecinos] = React.useState(false)
  const [cargandoTemplates, setCargandoTemplates] = React.useState(false)
  const [vecinos, setVecinos] = React.useState<any[]>([])
  const [templates, setTemplates] = React.useState<any[]>([])
  const [expensas, setExpensas] = React.useState<any[]>([])

  const [formData, setFormData] = React.useState({
    vecinoId: initialVecinoId || "",
    vecinoIds: [] as string[],
    expensaId: initialExpensaId || "",
    canal: "WHATSAPP" as "WHATSAPP" | "EMAIL",
    tipo: "MANUAL",
    templateId: "",
    contenido: "",
    asunto: "",
  })

  React.useEffect(() => {
    if (open) {
      fetchVecinos()
      fetchTemplates()
      if (formData.vecinoId) {
        fetchExpensas(formData.vecinoId)
      }
    }
  }, [open, formData.vecinoId])

  const fetchVecinos = async () => {
    try {
      setCargandoVecinos(true)
      const response = await vecinosApi.list()
      if (response.success && response.data) {
        const vecinosData = Array.isArray(response.data)
          ? response.data
          : (response.data as any)?.data || response.data
        setVecinos(Array.isArray(vecinosData) ? vecinosData : [])
      }
    } catch (err) {
      console.error("Error cargando vecinos:", err)
    } finally {
      setCargandoVecinos(false)
    }
  }

  const fetchTemplates = async () => {
    try {
      setCargandoTemplates(true)
      const response = await templatesApi.list({ activo: true })
      if (response.success && response.data) {
        const templatesData = Array.isArray(response.data)
          ? response.data
          : (response.data as any)?.data || response.data
        setTemplates(Array.isArray(templatesData) ? templatesData : [])
      }
    } catch (err) {
      console.error("Error cargando templates:", err)
    } finally {
      setCargandoTemplates(false)
    }
  }

  const fetchExpensas = async (vecinoId: string) => {
    try {
      const response = await expensasApi.list({ vecinoId })
      if (response.success && response.data) {
        const expensasData = Array.isArray(response.data)
          ? response.data
          : (response.data as any)?.data || response.data
        setExpensas(Array.isArray(expensasData) ? expensasData : [])
      }
    } catch (err) {
      console.error("Error cargando expensas:", err)
    }
  }

  const handleTemplateChange = async (templateId: string) => {
    if (!templateId) {
      setFormData({ ...formData, templateId: "", contenido: "", asunto: "" })
      return
    }

    try {
      const response = await templatesApi.get(templateId)
      if (response.success && response.data) {
        setFormData({
          ...formData,
          templateId,
          contenido: response.data.contenido || "",
          asunto: response.data.asunto || "",
        })
      }
    } catch (err) {
      console.error("Error cargando template:", err)
    }
  }

  const handleVecinoChange = (vecinoId: string) => {
    setFormData({ ...formData, vecinoId, expensaId: "" })
    if (vecinoId) {
      fetchExpensas(vecinoId)
    }
  }

  const handleToggleVecino = (vecinoId: string) => {
    const vecinoIds = formData.vecinoIds.includes(vecinoId)
      ? formData.vecinoIds.filter(id => id !== vecinoId)
      : [...formData.vecinoIds, vecinoId]
    setFormData({ ...formData, vecinoIds })
  }

  const handleSubmit = async () => {
    if (modo === "individual") {
      if (!formData.vecinoId || !formData.canal || !formData.tipo) {
        toast({
          title: "Error",
          description: "Completa todos los campos requeridos",
          variant: "destructive",
        })
        return
      }

      try {
        setLoading(true)
        const response = await mensajesApi.create({
          vecinoId: formData.vecinoId,
          expensaId: formData.expensaId || null,
          canal: formData.canal,
          tipo: formData.tipo,
          contenido: formData.contenido || undefined,
          asunto: formData.asunto || undefined,
          templateId: formData.templateId || undefined,
        })

        if (response.success) {
          toast({
            title: "Éxito",
            description: "Mensaje enviado correctamente",
          })
          onOpenChange(false)
          onSuccess?.()
        } else {
          toast({
            title: "Error",
            description: response.error || "Error al enviar mensaje",
            variant: "destructive",
          })
        }
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "Error al enviar mensaje",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    } else {
      // Batch
      if (formData.vecinoIds.length === 0 || !formData.canal || !formData.tipo) {
        toast({
          title: "Error",
          description: "Selecciona al menos un vecino y completa los campos requeridos",
          variant: "destructive",
        })
        return
      }

      try {
        setLoading(true)
        const expensaIdsMap: Record<string, string> = {}
        // Si hay expensa seleccionada, asociarla a todos los vecinos seleccionados
        if (formData.expensaId) {
          formData.vecinoIds.forEach(id => {
            expensaIdsMap[id] = formData.expensaId
          })
        }

        const response = await mensajesApi.sendBatch({
          vecinoIds: formData.vecinoIds,
          canal: formData.canal,
          tipo: formData.tipo,
          contenido: formData.contenido || undefined,
          asunto: formData.asunto || undefined,
          templateId: formData.templateId || undefined,
          expensaIds: Object.keys(expensaIdsMap).length > 0 ? expensaIdsMap : undefined,
        })

        if (response.success) {
          toast({
            title: "Éxito",
            description: `Procesando envío de ${response.data?.exitosos || 0} mensajes. Los mensajes se enviarán gradualmente.`,
          })
          onOpenChange(false)
          onSuccess?.()
        } else {
          toast({
            title: "Error",
            description: response.error || "Error al enviar mensajes",
            variant: "destructive",
          })
        }
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "Error al enviar mensajes",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const vecinosFiltrados = vecinos.filter(v => {
    if (modo === "individual" && formData.vecinoId) {
      return v.id === formData.vecinoId
    }
    return true
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enviar Mensaje</DialogTitle>
          <DialogDescription>
            Envía un mensaje a uno o varios vecinos usando un template o contenido personalizado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant={modo === "individual" ? "default" : "outline"}
              onClick={() => setModo("individual")}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Individual
            </Button>
            <Button
              type="button"
              variant={modo === "batch" ? "default" : "outline"}
              onClick={() => setModo("batch")}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Batch (Varios)
            </Button>
          </div>

          {modo === "individual" ? (
            <>
              <div className="space-y-2">
                <Label>Vecino *</Label>
                <Select
                  value={formData.vecinoId}
                  onValueChange={handleVecinoChange}
                  disabled={!!initialVecinoId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un vecino" />
                  </SelectTrigger>
                  <SelectContent>
                    {cargandoVecinos ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      vecinos.map((vecino) => (
                        <SelectItem key={vecino.id} value={vecino.id}>
                          {vecino.nombre} {vecino.apellido} ({vecino.email})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {formData.vecinoId && (
                <div className="space-y-2">
                  <Label>Expensa (opcional)</Label>
                  <Select
                    value={formData.expensaId}
                    onValueChange={(value) => setFormData({ ...formData, expensaId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una expensa" />
                    </SelectTrigger>
                    <SelectContent>
                      {expensas.map((expensa) => (
                        <SelectItem key={expensa.id} value={expensa.id}>
                          {expensa.periodo?.mes}/{expensa.periodo?.anio} - ${Number(expensa.monto).toLocaleString("es-AR")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2">
              <Label>Seleccionar Vecinos *</Label>
              <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                {cargandoVecinos ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {vecinos.map((vecino) => (
                      <div key={vecino.id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={formData.vecinoIds.includes(vecino.id)}
                          onCheckedChange={() => handleToggleVecino(vecino.id)}
                        />
                        <Label className="font-normal cursor-pointer">
                          {vecino.nombre} {vecino.apellido} ({vecino.email})
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {formData.vecinoIds.length} vecino(s) seleccionado(s)
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Canal *</Label>
              <Select
                value={formData.canal}
                onValueChange={(value: "WHATSAPP" | "EMAIL") => setFormData({ ...formData, canal: value })}
              >
                <SelectTrigger>
                  <SelectValue />
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
                  <SelectValue />
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

          <div className="space-y-2">
            <Label>Template (opcional)</Label>
            <Select
              value={formData.templateId}
              onValueChange={handleTemplateChange}
              disabled={cargandoTemplates}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un template o escribe contenido manual" />
              </SelectTrigger>
              <SelectContent>
                {cargandoTemplates ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  <>
                    <SelectItem value="">Sin template (contenido manual)</SelectItem>
                    {templates
                      .filter(t => t.canal === formData.canal)
                      .map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.nombre} ({template.tipo})
                        </SelectItem>
                      ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {formData.canal === "EMAIL" && (
            <div className="space-y-2">
              <Label>Asunto</Label>
              <Input
                value={formData.asunto}
                onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
                placeholder="Asunto del email"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Contenido {formData.templateId ? "(se llenará automáticamente con el template)" : "*"}</Label>
            <Textarea
              value={formData.contenido}
              onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
              placeholder="Escribe el contenido del mensaje o selecciona un template"
              rows={6}
              disabled={!!formData.templateId}
            />
            {formData.templateId && (
              <p className="text-xs text-muted-foreground">
                El contenido se generará automáticamente usando el template seleccionado y los datos del vecino/expensa
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              `Enviar ${modo === "batch" ? `a ${formData.vecinoIds.length} vecino(s)` : ""}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
