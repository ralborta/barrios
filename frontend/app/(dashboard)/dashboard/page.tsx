"use client"

import { KPICard } from "@/components/dashboard/kpi-card"
import { AccionesHoy } from "@/components/dashboard/acciones-hoy"
import { EmbudoMes } from "@/components/dashboard/embudo-mes"
import { TablaVecinos } from "@/components/dashboard/tabla-vecinos"
import { useExpensasStats } from "@/hooks/use-expensas"

export default function DashboardPage() {
  const { stats, loading } = useExpensasStats()

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KPICard
          title="Pendientes"
          value={stats.pendientes}
          change={{ value: "+5 Hoy", type: "increase" }}
        />
        <KPICard
          title="Pago Informado"
          value={stats.pagoInformado}
          change={{ value: "", type: "neutral" }}
        />
        <KPICard
          title="Confirmados"
          value={stats.confirmados}
          change={{ value: "+8 Sem.", type: "increase" }}
        />
        <KPICard
          title="En Mora"
          value={stats.enMora}
          change={{ value: "+2", type: "increase" }}
        />
        <KPICard
          title="En Recupero"
          value={stats.enRecupero}
          change={{ value: "", type: "neutral" }}
        />
        <KPICard
          title="Sin Respuesta"
          value={stats.sinRespuesta}
          change={{ value: "", type: "neutral" }}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Acciones de Hoy */}
        <div className="lg:col-span-1">
          <AccionesHoy />
        </div>

        {/* Embudo del Mes */}
        <div className="lg:col-span-2">
          <EmbudoMes />
        </div>
      </div>

      {/* Tabla de Vecinos */}
      <TablaVecinos />
    </div>
  )
}
