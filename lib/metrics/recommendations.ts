/**
 * Prometheus метрики для системы рекомендаций
 */

import { logger } from '@/lib/logger'

// Метрики накапливаются в памяти и экспортируются через /api/metrics
interface MetricValue {
  value: number
  labels: Record<string, string>
  timestamp: number
}

interface HistogramBucket {
  le: number
  count: number
}

interface HistogramValue {
  buckets: HistogramBucket[]
  sum: number
  count: number
  labels: Record<string, string>
}

class MetricsRegistry {
  private counters: Map<string, MetricValue[]> = new Map()
  private gauges: Map<string, MetricValue> = new Map()
  private histograms: Map<string, HistogramValue[]> = new Map()
  
  // Стандартные latency buckets
  private readonly LATENCY_BUCKETS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]
  
  counter(name: string, labels: Record<string, string> = {}): void {
    const key = this.makeKey(name, labels)
    const existing = this.counters.get(name) || []
    const idx = existing.findIndex((m) => this.makeKey(name, m.labels) === key)
    
    if (idx >= 0) {
      existing[idx].value++
      existing[idx].timestamp = Date.now()
    } else {
      existing.push({ value: 1, labels, timestamp: Date.now() })
    }
    
    this.counters.set(name, existing)
  }
  
  gauge(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = this.makeKey(name, labels)
    this.gauges.set(key, { value, labels, timestamp: Date.now() })
  }
  
  histogram(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = this.makeKey(name, labels)
    const existing = this.histograms.get(name) || []
    let histEntry = existing.find((h) => this.makeKey(name, h.labels) === key)
    
    if (!histEntry) {
      histEntry = {
        buckets: this.LATENCY_BUCKETS.map((le) => ({ le, count: 0 })),
        sum: 0,
        count: 0,
        labels,
      }
      existing.push(histEntry)
      this.histograms.set(name, existing)
    }
    
    histEntry.sum += value
    histEntry.count++
    
    for (const bucket of histEntry.buckets) {
      if (value <= bucket.le) {
        bucket.count++
      }
    }
  }
  
  private makeKey(name: string, labels: Record<string, string>): string {
    const sortedLabels = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',')
    return `${name}{${sortedLabels}}`
  }
  
  /**
   * Экспорт метрик в Prometheus формате
   */
  export(): string {
    const lines: string[] = []
    
    // Counters
    for (const [name, values] of this.counters) {
      lines.push(`# HELP ${name} Counter metric`)
      lines.push(`# TYPE ${name} counter`)
      for (const v of values) {
        const labels = Object.entries(v.labels)
          .map(([k, val]) => `${k}="${val}"`)
          .join(',')
        const labelStr = labels ? `{${labels}}` : ''
        lines.push(`${name}${labelStr} ${v.value}`)
      }
    }
    
    // Gauges
    const gaugesByName = new Map<string, MetricValue[]>()
    for (const [key, value] of this.gauges) {
      const name = key.split('{')[0]
      const existing = gaugesByName.get(name) || []
      existing.push(value)
      gaugesByName.set(name, existing)
    }
    
    for (const [name, values] of gaugesByName) {
      lines.push(`# HELP ${name} Gauge metric`)
      lines.push(`# TYPE ${name} gauge`)
      for (const v of values) {
        const labels = Object.entries(v.labels)
          .map(([k, val]) => `${k}="${val}"`)
          .join(',')
        const labelStr = labels ? `{${labels}}` : ''
        lines.push(`${name}${labelStr} ${v.value}`)
      }
    }
    
    // Histograms
    for (const [name, values] of this.histograms) {
      lines.push(`# HELP ${name} Histogram metric`)
      lines.push(`# TYPE ${name} histogram`)
      for (const v of values) {
        const labels = Object.entries(v.labels)
          .map(([k, val]) => `${k}="${val}"`)
          .join(',')
        const baseLabel = labels ? `{${labels}}` : ''
        
        for (const bucket of v.buckets) {
          const bucketLabel = labels 
            ? `{${labels},le="${bucket.le}"}` 
            : `{le="${bucket.le}"}`
          lines.push(`${name}_bucket${bucketLabel} ${bucket.count}`)
        }
        lines.push(`${name}_bucket{${labels ? labels + ',' : ''}le="+Inf"} ${v.count}`)
        lines.push(`${name}_sum${baseLabel} ${v.sum}`)
        lines.push(`${name}_count${baseLabel} ${v.count}`)
      }
    }
    
    return lines.join('\n')
  }
  
  /**
   * Получить summary метрик для логов
   */
  getSummary(): Record<string, any> {
    const summary: Record<string, any> = {}
    
    for (const [name, values] of this.counters) {
      summary[name] = values.reduce((sum, v) => sum + v.value, 0)
    }
    
    for (const [name, values] of this.histograms) {
      const totalCount = values.reduce((sum, v) => sum + v.count, 0)
      const totalSum = values.reduce((sum, v) => sum + v.sum, 0)
      summary[`${name}_avg`] = totalCount > 0 ? totalSum / totalCount : 0
      summary[`${name}_count`] = totalCount
    }
    
    return summary
  }
}

// Глобальный registry
export const metricsRegistry = new MetricsRegistry()

// ============ RECOMMENDATION METRICS ============

export const RecoMetrics = {
  /**
   * Инкремент количества запросов рекомендаций
   */
  requestCount(labels: { personalized: boolean; cache_hit: boolean }): void {
    metricsRegistry.counter('reco_requests_total', {
      personalized: String(labels.personalized),
      cache_hit: String(labels.cache_hit),
    })
  },
  
  /**
   * Latency запроса рекомендаций
   */
  requestLatency(ms: number, labels: { personalized: boolean }): void {
    metricsRegistry.histogram('reco_request_duration_ms', ms, {
      personalized: String(labels.personalized),
    })
  },
  
  /**
   * Latency скоринга
   */
  scoringLatency(ms: number): void {
    metricsRegistry.histogram('reco_scoring_duration_ms', ms, {})
  },
  
  /**
   * Количество кандидатов
   */
  candidatesCount(count: number): void {
    metricsRegistry.gauge('reco_candidates_count', count, {})
  },
  
  /**
   * Количество взаимодействий в профиле
   */
  profileInteractions(count: number): void {
    metricsRegistry.histogram('reco_profile_interactions', count, {})
  },
  
  /**
   * Impression - показ рекомендаций пользователю
   */
  impression(labels: { userId: string; promptIds: string[] }): void {
    metricsRegistry.counter('reco_impressions_total', {})
    logger.debug({ 
      event: 'recommendation_impression',
      userId: labels.userId,
      promptCount: labels.promptIds.length,
    }, 'Recommendation impression')
  },
  
  /**
   * Click - клик на рекомендованный промпт
   */
  click(labels: { userId: string; promptId: string; position: number }): void {
    metricsRegistry.counter('reco_clicks_total', {
      position: String(labels.position),
    })
    logger.info({
      event: 'recommendation_click',
      userId: labels.userId,
      promptId: labels.promptId,
      position: labels.position,
    }, 'Recommendation click')
  },
  
  /**
   * Copy - копирование рекомендованного промпта
   */
  copy(labels: { userId: string; promptId: string; position: number }): void {
    metricsRegistry.counter('reco_copies_total', {
      position: String(labels.position),
    })
    logger.info({
      event: 'recommendation_copy',
      userId: labels.userId,
      promptId: labels.promptId,
      position: labels.position,
    }, 'Recommendation copy')
  },
  
  /**
   * Error в системе рекомендаций
   */
  error(errorType: string): void {
    metricsRegistry.counter('reco_errors_total', { error_type: errorType })
  },
}

// ============ INTERACTION METRICS ============

export const InteractionMetrics = {
  /**
   * Количество взаимодействий
   */
  count(type: string, success: boolean): void {
    metricsRegistry.counter('interactions_total', {
      type,
      success: String(success),
    })
  },
  
  /**
   * Rate limited взаимодействия
   */
  rateLimited(type: string, reason: string): void {
    metricsRegistry.counter('interactions_rate_limited_total', {
      type,
      reason,
    })
  },
}


