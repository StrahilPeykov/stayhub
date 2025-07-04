'use client'

import { useState, useEffect } from 'react'

interface ServiceStatus {
  name: string
  url: string
  ping: 'loading' | 'success' | 'error'
  health: 'loading' | 'success' | 'error'
  api: 'loading' | 'success' | 'error'
  details?: string
}

export default function TestConnectionPage() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'Property', url: process.env.NEXT_PUBLIC_PROPERTY_SERVICE_URL || '', ping: 'loading', health: 'loading', api: 'loading' },
    { name: 'Booking', url: process.env.NEXT_PUBLIC_BOOKING_SERVICE_URL || '', ping: 'loading', health: 'loading', api: 'loading' },
    { name: 'Search', url: process.env.NEXT_PUBLIC_SEARCH_SERVICE_URL || '', ping: 'loading', health: 'loading', api: 'loading' },
    { name: 'User', url: process.env.NEXT_PUBLIC_USER_SERVICE_URL || '', ping: 'loading', health: 'loading', api: 'loading' },
  ])

  useEffect(() => {
    testAllServices()
  }, [])

  const testService = async (service: ServiceStatus, index: number) => {
    // Test ping
    try {
      const pingResponse = await fetch(`${service.url}/ping`)
      setServices(prev => prev.map((s, i) => 
        i === index ? { ...s, ping: pingResponse.ok ? 'success' : 'error' } : s
      ))
    } catch (error) {
      setServices(prev => prev.map((s, i) => 
        i === index ? { ...s, ping: 'error', details: error.message } : s
      ))
    }

    // Test health
    try {
      const healthResponse = await fetch(`${service.url}/health`)
      setServices(prev => prev.map((s, i) => 
        i === index ? { ...s, health: healthResponse.ok ? 'success' : 'error' } : s
      ))
    } catch (error) {
      setServices(prev => prev.map((s, i) => 
        i === index ? { ...s, health: 'error' } : s
      ))
    }

    // Test API endpoint
    try {
      let apiUrl = `${service.url}/api`
      if (service.name === 'Property') {
        apiUrl = `${service.url}/api/properties`
      } else if (service.name === 'Booking') {
        apiUrl = `${service.url}/api/v1/room-types`
      } else if (service.name === 'Search') {
        apiUrl = `${service.url}/api/search/health`
      } else if (service.name === 'User') {
        apiUrl = `${service.url}/api/users/health`
      }

      const apiResponse = await fetch(apiUrl)
      setServices(prev => prev.map((s, i) => 
        i === index ? { ...s, api: apiResponse.ok ? 'success' : 'error' } : s
      ))
    } catch (error) {
      setServices(prev => prev.map((s, i) => 
        i === index ? { ...s, api: 'error' } : s
      ))
    }
  }

  const testAllServices = () => {
    services.forEach((service, index) => {
      testService(service, index)
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'loading': return 'text-yellow-600'
      case 'success': return 'text-green-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loading': return '⏳'
      case 'success': return '✅'
      case 'error': return '❌'
      default: return '❓'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Backend Connectivity Test</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Service Status</h2>
            <button
              onClick={testAllServices}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Refresh Tests
            </button>
          </div>

          <div className="space-y-4">
            {services.map((service, index) => (
              <div key={service.name} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">{service.name} Service</h3>
                  <span className="text-sm text-gray-500">{service.url}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Ping</div>
                    <div className={`font-semibold ${getStatusColor(service.ping)}`}>
                      {getStatusIcon(service.ping)} {service.ping}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Health</div>
                    <div className={`font-semibold ${getStatusColor(service.health)}`}>
                      {getStatusIcon(service.health)} {service.health}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">API</div>
                    <div className={`font-semibold ${getStatusColor(service.api)}`}>
                      {getStatusIcon(service.api)} {service.api}
                    </div>
                  </div>
                </div>
                
                {service.details && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    {service.details}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Environment Variables</h3>
            <div className="space-y-1 text-sm">
              <div>Property URL: {process.env.NEXT_PUBLIC_PROPERTY_SERVICE_URL || 'Not set'}</div>
              <div>Booking URL: {process.env.NEXT_PUBLIC_BOOKING_SERVICE_URL || 'Not set'}</div>
              <div>Search URL: {process.env.NEXT_PUBLIC_SEARCH_SERVICE_URL || 'Not set'}</div>
              <div>User URL: {process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'Not set'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}