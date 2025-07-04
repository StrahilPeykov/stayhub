'use client'

import { useState, useEffect } from 'react'

interface ServiceStatus {
  name: string
  url: string
  ping: 'loading' | 'success' | 'error'
  health: 'loading' | 'success' | 'error'
  api: 'loading' | 'success' | 'error'
  details?: string
  apiData?: any
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
      const pingResponse = await fetch(`${service.url}/ping`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'text/plain, application/json',
        },
      })
      setServices(prev => prev.map((s, i) => 
        i === index ? { ...s, ping: pingResponse.ok ? 'success' : 'error' } : s
      ))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setServices(prev => prev.map((s, i) => 
        i === index ? { ...s, ping: 'error', details: errorMessage } : s
      ))
    }

    // Test health
    try {
      const healthResponse = await fetch(`${service.url}/health`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json, text/plain',
        },
      })
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
      let testDescription = 'Basic API'
      
      if (service.name === 'Property') {
        apiUrl = `${service.url}/api/properties`
        testDescription = 'Properties list'
        
        // Also test the debug endpoint
        try {
          const debugResponse = await fetch(`${service.url}/api/properties/debug/count`, {
            method: 'GET',
            mode: 'cors',
            headers: { 'Accept': 'text/plain' }
          })
          if (debugResponse.ok) {
            const debugText = await debugResponse.text()
            console.log('Property debug count:', debugText)
          }
        } catch (e) {
          console.log('Property debug endpoint not available')
        }
        
      } else if (service.name === 'Booking') {
        apiUrl = `${service.url}/api/v1/room-types`
        testDescription = 'Room types'
      } else if (service.name === 'Search') {
        apiUrl = `${service.url}/api/search/health`
        testDescription = 'Search health'
      } else if (service.name === 'User') {
        apiUrl = `${service.url}/api/users/health`
        testDescription = 'User health'
      }

      const apiResponse = await fetch(apiUrl, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      })
      
      const responseData = await apiResponse.json()
      
      setServices(prev => prev.map((s, i) => 
        i === index ? { 
          ...s, 
          api: apiResponse.ok ? 'success' : 'error',
          apiData: responseData,
          details: s.details ? s.details + ` | ${testDescription}: ${apiResponse.status}` : `${testDescription}: ${apiResponse.status}`
        } : s
      ))
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setServices(prev => prev.map((s, i) => 
        i === index ? { 
          ...s, 
          api: 'error',
          details: s.details ? s.details + ` | API Error: ${errorMessage}` : `API Error: ${errorMessage}`
        } : s
      ))
    }
  }

  const testAllServices = () => {
    // Reset all services to loading
    setServices(prev => prev.map(s => ({ ...s, ping: 'loading', health: 'loading', api: 'loading', details: undefined, apiData: undefined })))
    
    services.forEach((service, index) => {
      testService(service, index)
    })
  }

  const testSpecificEndpoint = async (url: string) => {
    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        },
      })
      const data = await response.json()
      console.log(`Response from ${url}:`, data)
      alert(`Success! Check console for response from ${url}`)
    } catch (error) {
      console.error(`Error testing ${url}:`, error)
      alert(`Error testing ${url}: ${error}`)
    }
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
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Backend Connectivity Test</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Service Status</h2>
            <button
              onClick={testAllServices}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Refresh Tests
            </button>
          </div>

          <div className="space-y-6">
            {services.map((service, index) => (
              <div key={service.name} className="border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">{service.name} Service</h3>
                  <span className="text-sm text-gray-500 font-mono">{service.url}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
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
                  <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
                    <strong>Details:</strong> {service.details}
                  </div>
                )}
                
                {service.apiData && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                    <div className="text-sm font-medium text-green-800 mb-2">API Response:</div>
                    <pre className="text-xs text-green-700 overflow-auto max-h-32">
                      {JSON.stringify(service.apiData, null, 2)}
                    </pre>
                  </div>
                )}
                
                {/* Quick test buttons */}
                <div className="flex gap-2 flex-wrap">
                  {service.name === 'Property' && (
                    <>
                      <button
                        onClick={() => testSpecificEndpoint(`${service.url}/api/properties`)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                      >
                        Test Properties
                      </button>
                      <button
                        onClick={() => testSpecificEndpoint(`${service.url}/api/properties/featured`)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                      >
                        Test Featured
                      </button>
                      <button
                        onClick={() => testSpecificEndpoint(`${service.url}/api/properties/debug/count`)}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm hover:bg-purple-200"
                      >
                        Debug Count
                      </button>
                    </>
                  )}
                  {service.name === 'Search' && (
                    <>
                      <button
                        onClick={() => testSpecificEndpoint(`${service.url}/api/search/properties`)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                      >
                        Test Search
                      </button>
                      <button
                        onClick={() => testSpecificEndpoint(`${service.url}/api/search/suggestions?query=paris`)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                      >
                        Test Suggestions
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="font-semibold text-lg mb-4">Environment Variables</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Property URL:</strong> 
              <span className="ml-2 font-mono text-gray-600">
                {process.env.NEXT_PUBLIC_PROPERTY_SERVICE_URL || 'Not set'}
              </span>
            </div>
            <div>
              <strong>Booking URL:</strong> 
              <span className="ml-2 font-mono text-gray-600">
                {process.env.NEXT_PUBLIC_BOOKING_SERVICE_URL || 'Not set'}
              </span>
            </div>
            <div>
              <strong>Search URL:</strong> 
              <span className="ml-2 font-mono text-gray-600">
                {process.env.NEXT_PUBLIC_SEARCH_SERVICE_URL || 'Not set'}
              </span>
            </div>
            <div>
              <strong>User URL:</strong> 
              <span className="ml-2 font-mono text-gray-600">
                {process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'Not set'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">🔧 Troubleshooting Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Make sure all backend services are running</li>
            <li>• Check CORS configuration on backend services</li>
            <li>• Verify database connections on backend</li>
            <li>• Ensure environment variables are set correctly</li>
            <li>• Check browser console for detailed error messages</li>
          </ul>
        </div>
      </div>
    </div>
  )
}