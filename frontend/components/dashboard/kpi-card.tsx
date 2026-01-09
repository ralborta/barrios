import { Card, CardContent } from "@/components/ui/card"
import { ArrowUp, ArrowDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface KPICardProps {
  title: string
  value: number
  change?: {
    value: number | string
    type: "increase" | "decrease" | "neutral"
  }
  className?: string
}

export function KPICard({ title, value, change, className }: KPICardProps) {
  const getChangeIcon = () => {
    if (!change) return null
    if (change.type === "increase") {
      return <ArrowUp className="h-4 w-4 text-green-500" />
    }
    if (change.type === "decrease") {
      return <ArrowDown className="h-4 w-4 text-red-500" />
    }
    return <Minus className="h-4 w-4 text-gray-400" />
  }

  const getChangeColor = () => {
    if (!change) return ""
    if (change.type === "increase") return "text-green-600"
    if (change.type === "decrease") return "text-red-600"
    return "text-gray-500"
  }

  return (
    <Card className={cn("", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-2">{value.toLocaleString()}</p>
          </div>
          {change && (
            <div className={cn("flex items-center gap-1 text-sm", getChangeColor())}>
              {getChangeIcon()}
              <span>{change.value}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
