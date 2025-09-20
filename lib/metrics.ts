type Counter = { add: (...args: any[]) => void }

type GaugeCallback = (result: { observe: (value: number, attributes?: Record<string, string>) => void }) => void

const createNoopCounter = (): Counter => ({ add: () => {} })

const optionalRequire = <T = any>(name: string): T | null => {
  try {
    return (Function('return require')())(name) as T
  } catch (error) {
    return null
  }
}

const api = optionalRequire<any>('@opentelemetry/api')

let viewEventsCounter: Counter = createNoopCounter()
let viewTokenIssuesCounter: Counter = createNoopCounter()
let viewRateLimitedCounter: Counter = createNoopCounter()
let rejectedViewsCounter: Counter = createNoopCounter()
let latestSnapshot: Array<{ id: string; views: number }> = []
let cardViewsGauge: { addCallback: (callback: GaugeCallback) => void } | null = null

if (api) {
  const meter = api.metrics.getMeter('prompthub.views')

  viewEventsCounter = meter.createCounter('view_events_total', {
    description: 'Total number of view events ingested',
  })

  viewTokenIssuesCounter = meter.createCounter('view_token_issues_total', {
    description: 'View tokens rejected or failed validation',
  })

  viewRateLimitedCounter = meter.createCounter('view_rate_limited_total', {
    description: 'View tracking attempts blocked by rate limiting',
  })

  rejectedViewsCounter = meter.createCounter('view_rejected_total', {
    description: 'View events rejected by antifraud rules',
  })

  cardViewsGauge = meter.createObservableGauge('card_views_gauge', {
    description: 'Latest denormalized view counts per card',
  })

  if (cardViewsGauge) {
    cardViewsGauge.addCallback((observableResult) => {
      for (const { id, views } of latestSnapshot) {
        observableResult.observe(views, { card_id: id })
      }
    })
  }
}

export { viewEventsCounter, viewTokenIssuesCounter, viewRateLimitedCounter, rejectedViewsCounter }

export function updateCardViewsGauge(snapshot: Array<{ id: string; views: number }>) {
  latestSnapshot = snapshot
}
