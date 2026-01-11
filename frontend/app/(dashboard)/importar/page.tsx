"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Upload, Download, CheckCircle2, XCircle, AlertCircle, FileText, Users, Receipt, FileCheck } from "lucide-react"
import { importApi } from "@/lib/api"
import { countriesApi } from "@/lib/api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ImportVecinosResult {
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

interface ImportComprobantesResult {
  total: number
  exitosos: number
  errores: number
  resultados: {
    exitosos: Array<{ fila: number; comprobante: any }>
    errores: Array<{ fila: number; error: string; datos: any }>
  }
}

interface ImportBoletasResult {
  total: number
  exitosos: number
  errores: number
  resultados: {
    exitosos: Array<{ fila: number; expensa: any }>
    errores: Array<{ fila: number; error: string; datos: any }>
  }
}

export default function ImportarPage() {
  // Estados para importación de vecinos
  const [vecinosFile, setVecinosFile] = React.useState<File | null>(null)
  const [countryId, setCountryId] = React.useState<string>("")
  const [vecinosLoading, setVecinosLoading] = React.useState(false)
  const [vecinosResult, setVecinosResult] = React.useState<ImportVecinosResult | null>(null)
  const [vecinosError, setVecinosError] = React.useState<string | null>(null)
  
  // Estados para importación de comprobantes
  const [comprobantesFile, setComprobantesFile] = React.useState<File | null>(null)
  const [comprobantesLoading, setComprobantesLoading] = React.useState(false)
  const [comprobantesResult, setComprobantesResult] = React.useState<ImportComprobantesResult | null>(null)
  const [comprobantesError, setComprobantesError] = React.useState<string | null>(null)
  
  // Estados para importación de boletas
  const [boletasFile, setBoletasFile] = React.useState<File | null>(null)
  const [boletasLoading, setBoletasLoading] = React.useState(false)
  const [boletasResult, setBoletasResult] = React.useState<ImportBoletasResult | null>(null)
  const [boletasError, setBoletasError] = React.useState<string | null>(null)
  
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

  // Handlers para vecinos
  const handleVecinosFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setVecinosError('Por favor, selecciona un archivo CSV')
        return
      }
      setVecinosFile(selectedFile)
      setVecinosError(null)
      setVecinosResult(null)
    }
  }

  const handleDownloadVecinosTemplate = async () => {
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
      setVecinosError('Error al descargar el template')
    }
  }

  const handleImportVecinos = async () => {
    if (!vecinosFile) {
      setVecinosError('Por favor, selecciona un archivo')
      return
    }

    if (!countryId) {
      setVecinosError('Por favor, selecciona un barrio/país')
      return
    }

    setVecinosLoading(true)
    setVecinosError(null)
    setVecinosResult(null)

    try {
      const text = await vecinosFile.text()
      const lines = text.split('\n')
      const header = lines[0]
      
      if (!header.includes('countryId')) {
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
        const newFile = new File([newBlob], vecinosFile.name, { type: 'text/csv' })
        
        const response = await importApi.importVecinos(newFile)
        
        if (response.success && response.data) {
          setVecinosResult(response.data as ImportVecinosResult)
        } else {
          setVecinosError(response.error || 'Error al importar el archivo')
        }
      } else {
        const response = await importApi.importVecinos(vecinosFile)
        
        if (response.success && response.data) {
          setVecinosResult(response.data as ImportVecinosResult)
        } else {
          setVecinosError(response.error || 'Error al importar el archivo')
        }
      }
    } catch (err: any) {
      setVecinosError(err.message || 'Error al procesar el archivo')
    } finally {
      setVecinosLoading(false)
    }
  }

  // Handlers para comprobantes
  const handleComprobantesFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setComprobantesError('Por favor, selecciona un archivo CSV')
        return
      }
      setComprobantesFile(selectedFile)
      setComprobantesError(null)
      setComprobantesResult(null)
    }
  }

  const handleDownloadComprobantesTemplate = async () => {
    try {
      const response = await importApi.downloadComprobantesTemplate()
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'template_comprobantes.csv'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (err) {
      setComprobantesError('Error al descargar el template')
    }
  }

  const handleImportComprobantes = async () => {
    if (!comprobantesFile) {
      setComprobantesError('Por favor, selecciona un archivo')
      return
    }

    setComprobantesLoading(true)
    setComprobantesError(null)
    setComprobantesResult(null)

    try {
      const response = await importApi.importComprobantes(comprobantesFile)
      
      if (response.success && response.data) {
        setComprobantesResult(response.data as ImportComprobantesResult)
      } else {
        setComprobantesError(response.error || 'Error al importar el archivo')
      }
    } catch (err: any) {
      setComprobantesError(err.message || 'Error al procesar el archivo')
    } finally {
      setComprobantesLoading(false)
    }
  }

  // Handlers para boletas
  const handleBoletasFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setBoletasError('Por favor, selecciona un archivo CSV')
        return
      }
      setBoletasFile(selectedFile)
      setBoletasError(null)
      setBoletasResult(null)
    }
  }

  const handleDownloadBoletasTemplate = async () => {
    try {
      const response = await importApi.downloadBoletasTemplate()
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'template_boletas.csv'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (err) {
      setBoletasError('Error al descargar el template')
    }
  }

  const handleImportBoletas = async () => {
    if (!boletasFile) {
      setBoletasError('Por favor, selecciona un archivo')
      return
    }

    setBoletasLoading(true)
    setBoletasError(null)
    setBoletasResult(null)

    try {
      const response = await importApi.importBoletas(boletasFile)
      
      if (response.success && response.data) {
        setBoletasResult(response.data as ImportBoletasResult)
      } else {
        setBoletasError(response.error || 'Error al importar el archivo')
      }
    } catch (err: any) {
      setBoletasError(err.message || 'Error al procesar el archivo')
    } finally {
      setBoletasLoading(false)
    }
  }

  return (
    <div className="space-y-6">
    <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">Importar Datos desde CSV</h1>
        <p className="text-muted-foreground">
          Importa vecinos, comprobantes de pago o boletas desde archivos CSV
        </p>
      </div>

      <Tabs defaultValue="vecinos" className="space-y-6">
        <TabsList>
          <TabsTrigger value="vecinos">
            <Users className="mr-2 h-4 w-4" />
            Importar Vecinos
          </TabsTrigger>
          <TabsTrigger value="comprobantes">
            <Receipt className="mr-2 h-4 w-4" />
            Importar Comprobantes
          </TabsTrigger>
          <TabsTrigger value="boletas">
            <FileCheck className="mr-2 h-4 w-4" />
            Importar Boletas
          </TabsTrigger>
        </TabsList>

        {/* Tab de Vecinos */}
        <TabsContent value="vecinos" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Subir Archivo CSV de Vecinos</CardTitle>
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
                  <Label htmlFor="vecinos-file">Archivo CSV</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="vecinos-file"
                      type="file"
                      accept=".csv"
                      onChange={handleVecinosFileChange}
                      disabled={vecinosLoading}
                    />
                    {vecinosFile && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        {vecinosFile.name}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleImportVecinos}
                    disabled={!vecinosFile || !countryId || vecinosLoading}
                    className="flex-1"
                  >
                    {vecinosLoading ? (
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
                    onClick={handleDownloadVecinosTemplate}
                    disabled={vecinosLoading}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Template
                  </Button>
                </div>

                {vecinosError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{vecinosError}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Formato del CSV - Vecinos</CardTitle>
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
                    onClick={handleDownloadVecinosTemplate}
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Descargar Template de Ejemplo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resultados Vecinos */}
          {vecinosResult && (
            <Card>
              <CardHeader>
                <CardTitle>Resultados de la Importación de Vecinos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{vecinosResult.total}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {vecinosResult.exitosos}
                    </div>
                    <div className="text-sm text-muted-foreground">Exitosos</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {vecinosResult.errores}
                    </div>
                    <div className="text-sm text-muted-foreground">Errores</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {vecinosResult.duplicados}
                    </div>
                    <div className="text-sm text-muted-foreground">Duplicados</div>
                  </div>
                </div>

                {vecinosResult.resultados.errores.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-semibold flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      Errores ({vecinosResult.resultados.errores.length})
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {vecinosResult.resultados.errores.map((error, index) => (
                        <Alert key={index} variant="destructive">
                          <AlertDescription>
                            <strong>Fila {error.fila}:</strong> {error.error}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}

                {vecinosResult.resultados.duplicados.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-semibold flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      Duplicados ({vecinosResult.resultados.duplicados.length})
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {vecinosResult.resultados.duplicados.map((dup, index) => (
                        <Alert key={index}>
                          <AlertDescription>
                            <strong>Fila {dup.fila}:</strong> El email {dup.email} ya existe en el sistema
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}

                {vecinosResult.resultados.exitosos.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-semibold flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Vecinos Importados ({vecinosResult.resultados.exitosos.length})
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {vecinosResult.resultados.exitosos.map((success, index) => (
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
        </TabsContent>

        {/* Tab de Comprobantes */}
        <TabsContent value="comprobantes" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Subir Archivo CSV de Comprobantes</CardTitle>
                <CardDescription>
                  Selecciona un archivo CSV con los datos de los comprobantes de pago
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="comprobantes-file">Archivo CSV</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="comprobantes-file"
                      type="file"
                      accept=".csv"
                      onChange={handleComprobantesFileChange}
                      disabled={comprobantesLoading}
                    />
                    {comprobantesFile && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        {comprobantesFile.name}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleImportComprobantes}
                    disabled={!comprobantesFile || comprobantesLoading}
                    className="flex-1"
                  >
                    {comprobantesLoading ? (
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
                    onClick={handleDownloadComprobantesTemplate}
                    disabled={comprobantesLoading}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Template
                  </Button>
                </div>

                {comprobantesError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{comprobantesError}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Formato del CSV - Comprobantes</CardTitle>
                <CardDescription>
                  El archivo CSV debe tener las siguientes columnas:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="font-semibold">Columnas requeridas:</div>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li><code className="bg-muted px-1 rounded">vecinoEmail</code> - Email del vecino</li>
                    <li><code className="bg-muted px-1 rounded">url</code> - URL o ruta del archivo del comprobante</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <div className="font-semibold">Columnas opcionales:</div>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li><code className="bg-muted px-1 rounded">expensaId</code> - ID de la expensa (opcional)</li>
                    <li><code className="bg-muted px-1 rounded">nombreArchivo</code> - Nombre del archivo</li>
                    <li><code className="bg-muted px-1 rounded">tipoArchivo</code> - Tipo MIME (ej: application/pdf, image/jpeg)</li>
                    <li><code className="bg-muted px-1 rounded">estado</code> - Estado inicial (NUEVO, REVISADO, CONFIRMADO, RECHAZADO)</li>
                    <li><code className="bg-muted px-1 rounded">observaciones</code> - Observaciones adicionales</li>
                  </ul>
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Nota:</strong> La URL puede ser una ruta relativa (ej: /uploads/archivo.pdf) o una URL completa.
                    Los archivos deben estar accesibles desde el servidor.
                  </AlertDescription>
                </Alert>
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handleDownloadComprobantesTemplate}
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Descargar Template de Ejemplo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resultados Comprobantes */}
          {comprobantesResult && (
            <Card>
              <CardHeader>
                <CardTitle>Resultados de la Importación de Comprobantes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{comprobantesResult.total}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {comprobantesResult.exitosos}
                    </div>
                    <div className="text-sm text-muted-foreground">Exitosos</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {comprobantesResult.errores}
                    </div>
                    <div className="text-sm text-muted-foreground">Errores</div>
                  </div>
                </div>

                {comprobantesResult.resultados.errores.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-semibold flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      Errores ({comprobantesResult.resultados.errores.length})
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {comprobantesResult.resultados.errores.map((error, index) => (
                        <Alert key={index} variant="destructive">
                          <AlertDescription>
                            <strong>Fila {error.fila}:</strong> {error.error}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}

                {comprobantesResult.resultados.exitosos.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-semibold flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Comprobantes Importados ({comprobantesResult.resultados.exitosos.length})
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {comprobantesResult.resultados.exitosos.map((success, index) => (
                        <Alert key={index} className="bg-green-50 dark:bg-green-950">
                          <AlertDescription>
                            <strong>Fila {success.fila}:</strong> {success.comprobante.nombreArchivo} - {success.comprobante.vecino.nombre} {success.comprobante.vecino.apellido}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab de Boletas */}
        <TabsContent value="boletas" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Subir Archivo CSV de Boletas</CardTitle>
                <CardDescription>
                  Selecciona un archivo CSV con las boletas de las expensas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="boletas-file">Archivo CSV</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="boletas-file"
                      type="file"
                      accept=".csv"
                      onChange={handleBoletasFileChange}
                      disabled={boletasLoading}
                    />
                    {boletasFile && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        {boletasFile.name}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleImportBoletas}
                    disabled={!boletasFile || boletasLoading}
                    className="flex-1"
                  >
                    {boletasLoading ? (
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
                    onClick={handleDownloadBoletasTemplate}
                    disabled={boletasLoading}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Template
                  </Button>
                </div>

                {boletasError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{boletasError}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Formato del CSV - Boletas/Expensas</CardTitle>
                <CardDescription>
                  El archivo CSV debe tener las siguientes columnas. Se crearán o actualizarán las expensas con todos sus datos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="font-semibold">Columnas requeridas:</div>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li><code className="bg-muted px-1 rounded">vecinoEmail</code> - Email del vecino</li>
                    <li><code className="bg-muted px-1 rounded">countryId</code> - ID del country/barrio</li>
                    <li><code className="bg-muted px-1 rounded">mes</code> - Mes (1-12)</li>
                    <li><code className="bg-muted px-1 rounded">anio</code> - Año (ej: 2024)</li>
                    <li><code className="bg-muted px-1 rounded">monto</code> - Monto de la expensa (ej: 15000.50)</li>
                    <li><code className="bg-muted px-1 rounded">fechaVencimiento</code> - Fecha de vencimiento (ISO: 2024-01-15T00:00:00Z)</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <div className="font-semibold">Columnas opcionales:</div>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li><code className="bg-muted px-1 rounded">vecinoId</code> - ID del vecino (si no se usa vecinoEmail)</li>
                    <li><code className="bg-muted px-1 rounded">periodoId</code> - ID del período (si ya existe)</li>
                    <li><code className="bg-muted px-1 rounded">estado</code> - Estado inicial (PENDIENTE, EN_MORA, etc.)</li>
                    <li><code className="bg-muted px-1 rounded">boletaUrl</code> - URL o ruta del archivo de la boleta</li>
                    <li><code className="bg-muted px-1 rounded">boletaNombreArchivo</code> - Nombre del archivo</li>
                    <li><code className="bg-muted px-1 rounded">boletaTipoArchivo</code> - Tipo MIME (ej: application/pdf, image/jpeg)</li>
                  </ul>
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Nota:</strong> Si el período no existe, se creará automáticamente. Si la expensa ya existe para ese vecino y período, se actualizará con los nuevos datos.
                    La boletaUrl puede ser una ruta relativa (ej: /uploads/boleta.pdf) o una URL completa.
                  </AlertDescription>
                </Alert>
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handleDownloadBoletasTemplate}
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Descargar Template de Ejemplo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resultados Boletas */}
          {boletasResult && (
            <Card>
              <CardHeader>
                <CardTitle>Resultados de la Importación de Boletas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{boletasResult.total}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {boletasResult.exitosos}
                    </div>
                    <div className="text-sm text-muted-foreground">Exitosos</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {boletasResult.errores}
                    </div>
                    <div className="text-sm text-muted-foreground">Errores</div>
                  </div>
                </div>

                {boletasResult.resultados.errores.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-semibold flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      Errores ({boletasResult.resultados.errores.length})
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {boletasResult.resultados.errores.map((error, index) => (
                        <Alert key={index} variant="destructive">
                          <AlertDescription>
                            <strong>Fila {error.fila}:</strong> {error.error}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}

                {boletasResult.resultados.exitosos.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-semibold flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Boletas Importadas ({boletasResult.resultados.exitosos.length})
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {boletasResult.resultados.exitosos.map((success, index) => (
                        <Alert key={index} className="bg-green-50 dark:bg-green-950">
                          <AlertDescription>
                            <strong>Fila {success.fila}:</strong> {success.expensa.vecino.nombre} {success.expensa.vecino.apellido} - {success.expensa.periodo.mes}/{success.expensa.periodo.anio} - {success.expensa.boletaNombreArchivo || 'boleta.pdf'}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
