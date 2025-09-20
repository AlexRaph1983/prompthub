const optionalRequire = <T = any>(name: string): T | null => {
  try {
    return (Function('return require')())(name) as T
  } catch (error) {
    return null
  }
}

const globalForOtel = globalThis as unknown as { __promptHubOtelSdk?: any }

export async function register() {
  if (process.env.NODE_ENV === 'test') {
    return
  }

  if (globalForOtel.__promptHubOtelSdk) {
    return
  }

  const api = optionalRequire<any>('@opentelemetry/api')
  const exporterModule = optionalRequire<any>('@opentelemetry/exporter-prometheus')
  const sdkModule = optionalRequire<any>('@opentelemetry/sdk-node')
  const semconv = optionalRequire<any>('@opentelemetry/semantic-conventions')

  if (!api || !exporterModule || !sdkModule || !semconv) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('OpenTelemetry libraries not installed. Skipping instrumentation setup.')
    }
    return
  }

  const { diag, DiagConsoleLogger, DiagLogLevel } = api
  const { PrometheusExporter } = exporterModule
  const { NodeSDK } = sdkModule
  const { SemanticResourceAttributes } = semconv

  if (process.env.OTEL_DIAG_LOG_LEVEL) {
    const level = process.env.OTEL_DIAG_LOG_LEVEL.toUpperCase()
    const diagLevels: Record<string, number> = {
      ERROR: DiagLogLevel.ERROR,
      WARN: DiagLogLevel.WARN,
      INFO: DiagLogLevel.INFO,
      DEBUG: DiagLogLevel.DEBUG,
      VERBOSE: DiagLogLevel.VERBOSE,
    }
    diag.setLogger(new DiagConsoleLogger(), diagLevels[level] ?? DiagLogLevel.ERROR)
  }

  const prometheusPort = Number(process.env.OTEL_PROMETHEUS_PORT || 9464)
  const prometheusEndpoint = process.env.OTEL_PROMETHEUS_ENDPOINT || '/metrics'

  const exporter = new PrometheusExporter({
    port: prometheusPort,
    preventServerStart: false,
    endpoint: prometheusEndpoint,
  })

  const resourceModule = optionalRequire<any>('@opentelemetry/resources')
  const resourceFromAttributes = resourceModule?.resourceFromAttributes

  if (typeof resourceFromAttributes !== 'function') {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('OpenTelemetry resource helpers not available. Skipping instrumentation setup.')
    }
    return
  }

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'prompthub-web',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV,
    }),
    metricReader: exporter,
  })

  try {
    await sdk.start()
  } catch (error) {
    console.error('Failed to start OpenTelemetry SDK', error)
    return
  }

  process.once('SIGTERM', () => {
    sdk.shutdown().catch(() => {})
  })
  process.once('SIGINT', () => {
    sdk.shutdown().catch(() => {})
  })

  globalForOtel.__promptHubOtelSdk = sdk
}
