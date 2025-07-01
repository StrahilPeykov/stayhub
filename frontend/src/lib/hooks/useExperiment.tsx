'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAnalytics } from './useAnalytics'

interface Experiment {
  key: string
  variant: 'control' | 'treatment'
}

interface ExperimentContextType {
  experiments: Map<string, Experiment>
  getVariant: (experimentKey: string) => 'control' | 'treatment'
}

const ExperimentContext = createContext<ExperimentContextType | undefined>(undefined)

// Hash function to deterministically assign users to variants
function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

// Configuration for experiments
const EXPERIMENTS = {
  'property-card-design': {
    enabled: true,
    trafficPercentage: 50, // 50% get treatment
  },
  'search-algorithm': {
    enabled: true,
    trafficPercentage: 30,
  },
  'booking-flow': {
    enabled: true,
    trafficPercentage: 20,
  },
  'price-display': {
    enabled: true,
    trafficPercentage: 50,
  },
} as const

export function ExperimentProvider({ children }: { children: ReactNode }) {
  const [experiments] = useState<Map<string, Experiment>>(() => new Map())
  const { track } = useAnalytics()
  
  useEffect(() => {
    // Get or create user ID for consistent experiment assignment
    let userId = localStorage.getItem('experiment_user_id')
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('experiment_user_id', userId)
    }
    
    // Assign user to experiments
    Object.entries(EXPERIMENTS).forEach(([key, config]) => {
      if (!config.enabled) return
      
      const hash = hashCode(`${userId}_${key}`)
      const variant = (hash % 100) < config.trafficPercentage ? 'treatment' : 'control'
      
      experiments.set(key, { key, variant })
      
      // Track experiment exposure
      track('experiment_exposed', {
        experiment_key: key,
        variant,
        user_id: userId,
      })
    })
  }, [experiments, track])
  
  const getVariant = (experimentKey: string): 'control' | 'treatment' => {
    const experiment = experiments.get(experimentKey)
    return experiment?.variant || 'control'
  }
  
  return (
    <ExperimentContext.Provider value={{ experiments, getVariant }}>
      {children}
    </ExperimentContext.Provider>
  )
}

export function useExperiment(experimentKey: string) {
  const context = useContext(ExperimentContext)
  if (!context) {
    throw new Error('useExperiment must be used within ExperimentProvider')
  }
  
  const variant = context.getVariant(experimentKey)
  const { track } = useAnalytics()
  
  const trackConversion = (eventName: string, properties?: Record<string, any>) => {
    track(`experiment_${eventName}`, {
      experiment_key: experimentKey,
      variant,
      ...properties,
    })
  }
  
  return { variant, trackConversion }
}