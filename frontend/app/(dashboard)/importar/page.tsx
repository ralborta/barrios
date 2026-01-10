"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Upload, Download, CheckCircle2, XCircle, AlertCircle, FileText } from "lucide-react"
import { importApi } from "@/lib/api"
import { countriesApi } from "@/lib/api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ImportResult {
  total: number
  exitosos: number
  errores: number
  duplicados: number
  resultados: {
    exitosos: Array<{ fila: number; vecino: any }>
    errores: Array<{ fila: number; error: string; datos: any }>
    duplicados: Array<{ fila: number; email: string }>
  }
}

export default function ImportarPage() {
  const [file, setFile] = React.useState<File | null>(null)
  const [countryId, setCountryId] = React.useState<string>("")
  const [loading, setLoading] = React.useState(false)
  const [result, setResult] = React.useState<ImportResult | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [countries, setCountries] = React.useState<Array<{ id: string; name: string }>>([])

  React.useEffect(() => {
    fetchCountries()
  }, [])

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Por favor, selecciona un archivo CSV')
        return
      }
      setFile(selectedFile)
      setError(null)
      setResult(null)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await importApi.downloadTemplate()
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'template_vecinos.csv'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (err) {
      setError('Error al descargar el template')
    }
  }

  const handleImport = async () => {
    if (!file) {
      setError('Por favor, selecciona un archivo')
      return
    }

    if (!countryId) {
      setError('Por favor, selecciona un barrio/país')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Leer el archivo y reemplazar countryId si es necesario
      const text = await file.text()
      const lines = text.split('\n')
      const header = lines[0]
      
      // Verificar si el CSV tiene la columna countryId
      if (!header.includes('countryId')) {
        // Agregar countryId a cada fila
        const newLines = lines.map((line, index) => {
          if (index === 0) {
            return line + ',countryId'
          }
          if (line.trim()) {
            return line + `,${countryId}`
          }
          return line
        })
        const newText = newLines.join('\n')
        const newBlob = new Blob([newText], { type: 'text/csv' })
        const newFile = new File([newBlob], file.name, { type: 'text/csv' })
        
        const response = await importApi.importVecinos(newFile)
        
        if (response.success && response.data) {
          setResult(response.data as ImportResult)
        } else {
          setError(response.error || 'Error al importar el archivo')
        }
      } else {
        // El CSV ya tiene countryId, usarlo directamente
        const response = await importApi.importVecinos(file)
        
        if (response.success && response.data) {
          setResult(response.data as ImportResult)
        } else {
          setError(response.error || 'Error al importar el archivo')
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar el archivo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Importar Vecinos desde CSV</h1>
        <p className="text-muted-foreground">
          Carga un archivo CSV con los datos de los vecinos para importarlos al sistema
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Formulario de carga */}
        <Card>
          <CardHeader>
            <CardTitle>Subir Archivo CSV</CardTitle>
            <CardDescription>
              Selecciona un archivo CSV con los datos de los vecinos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="country">Barrio/País</Label>
              <Select value={countryId} onValueChange={setCountryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un barrio/país" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.id} value={country.id}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Archivo CSV</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={loading}
                />
                {file && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    {file.name}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleImport}
                disabled={!file || !countryId || loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Importar
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadTemplate}
                disabled={loading}
              >
                <Download className="mr-2 h-4 w-4" />
                Template
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Instrucciones */}
        <Card>
          <CardHeader>
            <CardTitle>Formato del CSV</CardTitle>
            <CardDescription>
              El archivo CSV debe tener las siguientes columnas:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="font-semibold">Columnas requeridas:</div>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><code className="bg-muted px-1 rounded">nombre</code> - Nombre del vecino</li>
                <li><code className="bg-muted px-1 rounded">apellido</code> - Apellido del vecino</li>
                <li><code className="bg-muted px-1 rounded">email</code> - Email único del vecino</li>
                <li><code className="bg-muted px-1 rounded">countryId</code> - ID del barrio/país (o se usará el seleccionado)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="font-semibold">Columnas opcionales:</div>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><code className="bg-muted px-1 rounded">telefono</code> - Teléfono del vecino</li>
                <li><code className="bg-muted px-1 rounded">unidad</code> - Unidad/Lote/Casa</li>
                <li><code className="bg-muted px-1 rounded">observaciones</code> - Observaciones adicionales</li>
              </ul>
            </div>
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleDownloadTemplate}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar Template de Ejemplo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resultados */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados de la Importación</CardTitle>
            <CardDescription>
              Resumen de la importación realizada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{result.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {result.exitosos}
                </div>
                <div className="text-sm text-muted-foreground">Exitosos</div>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {result.errores}
                </div>
                <div className="text-sm text-muted-foreground">Errores</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {result.duplicados}
                </div>
                <div className="text-sm text-muted-foreground">Duplicados</div>
              </div>
            </div>

            {result.resultados.errores.length > 0 && (
              <div className="space-y-2">
                <div className="font-semibold flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Errores ({result.resultados.errores.length})
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {result.resultados.errores.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertDescription>
                        <strong>Fila {error.fila}:</strong> {error.error}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {result.resultados.duplicados.length > 0 && (
              <div className="space-y-2">
                <div className="font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  Duplicados ({result.resultados.duplicados.length})
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {result.resultados.duplicados.map((dup, index) => (
                    <Alert key={index}>
                      <AlertDescription>
                        <strong>Fila {dup.fila}:</strong> El email {dup.email} ya existe en el sistema
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {result.resultados.exitosos.length > 0 && (
              <div className="space-y-2">
                <div className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Vecinos Importados ({result.resultados.exitosos.length})
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {result.resultados.exitosos.map((success, index) => (
                    <Alert key={index} className="bg-green-50 dark:bg-green-950">
                      <AlertDescription>
                        <strong>Fila {success.fila}:</strong> {success.vecino.nombre} {success.vecino.apellido} ({success.vecino.email})
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
