"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts"

const data = [
  { name: "Pendientes", value: 42, color: "#3b82f6" },
  { name: "Informados", value: 28, color: "#f59e0b" },
  { name: "Confirmados", value: 65, color: "#10b981" },
  { name: "En Mora", value: 12, color: "#ef4444" },
  { name: "En Recupero", value: 5, color: "#a855f7" },
  { name: "Sin Recupero", value: 14, color: "#6b7280" },
]

export function EmbudoMes() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Embudo del Mes</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={120} />
            <Tooltip />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 flex flex-wrap gap-4">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-muted-foreground">{item.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
