export const AB_TEST_CONFIG = {
  experimentId: 'search_enhancement_v1',
  variants: {
    control: {
      id: 'control',
      name: 'Baseline',
      weight: 50,
      features: {
        enhancedPlaceholder: false,
        showChips: false,
        showEmptyState: false,
        hotkey: false
      }
    },
    treatment: {
      id: 'treatment', 
      name: 'Enhanced',
      weight: 50,
      features: {
        enhancedPlaceholder: true,
        showChips: true,
        showEmptyState: true,
        hotkey: true
      }
    }
  },
  duration: 14, // days
  successMetrics: [
    'search_start_rate',
    'search_submitted',
    'suggestion_click_rate',
    'searches_per_session'
  ]
}

export function getABTestVariant(): string {
  if (typeof window === 'undefined') return 'control'
  
  const stored = localStorage.getItem('ab_test_variant')
  if (stored) return stored
  
  const random = Math.random()
  const variant = random < 0.5 ? 'control' : 'treatment'
  localStorage.setItem('ab_test_variant', variant)
  
  return variant
}

export function getABTestFeatures() {
  const variant = getABTestVariant()
  return AB_TEST_CONFIG.variants[variant as keyof typeof AB_TEST_CONFIG.variants].features
}
