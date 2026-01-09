import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, FileText, AlertTriangle } from "lucide-react"

interface Accion {
  id: string
  texto: string
  icon: React.ReactNode
  color: string
}

const acciones: Accion[] = [
  {
    id: "1",
    texto: "8 Vecinos vencen hoy",
    icon: <Calendar className="h-5 w-5" />,
    color: "text-blue-600",
  },
  {
    id: "2",
    texto: "4 Comprobantes nuevos",
    icon: <FileText className="h-5 w-5" />,
    color: "text-green-600",
  },
  {
    id: "3",
    texto: "5 Pasarán a mora en 2 días",
    icon: <AlertTriangle className="h-5 w-5" />,
    color: "text-orange-600",
  },
]

export function AccionesHoy() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Acciones de Hoy</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {acciones.map((accion) => (
            <div
              key={accion.id}
              className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
            >
              <div className={accion.color}>{accion.icon}</div>
              <p className="text-sm font-medium">{accion.texto}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
