'use client'

import { Shield, Users, Star, Globe } from 'lucide-react'

const indicators = [
  {
    icon: Users,
    stat: '50M+',
    label: 'Happy customers worldwide',
  },
  {
    icon: Star,
    stat: '4.8/5',
    label: 'Average customer rating',
  },
  {
    icon: Globe,
    stat: '200+',
    label: 'Countries available',
  },
  {
    icon: Shield,
    stat: '100%',
    label: 'Secure bookings guaranteed',
  },
]

export function TrustIndicators() {
  return (
    <section className="py-12 bg-white border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {indicators.map((indicator, index) => (
            <div key={index} className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <indicator.icon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {indicator.stat}
              </div>
              <div className="text-sm text-gray-600">
                {indicator.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}