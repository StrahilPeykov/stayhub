export async function testBackendConnectivity() {
  const services = [
    { name: 'Property', url: process.env.NEXT_PUBLIC_PROPERTY_SERVICE_URL },
    { name: 'Booking', url: process.env.NEXT_PUBLIC_BOOKING_SERVICE_URL },
    { name: 'Search', url: process.env.NEXT_PUBLIC_SEARCH_SERVICE_URL },
    { name: 'User', url: process.env.NEXT_PUBLIC_USER_SERVICE_URL },
  ]

  console.log('🔍 Testing backend connectivity...')
  
  for (const service of services) {
    try {
      console.log(`Testing ${service.name} service...`)
      console.log(`URL: ${service.url}`)
      
      // Test basic connectivity
      const pingResponse = await fetch(`${service.url}/ping`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      console.log(`${service.name} ping status:`, pingResponse.status)
      console.log(`${service.name} ping response:`, await pingResponse.text())
      
      // Test health endpoint
      const healthResponse = await fetch(`${service.url}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      console.log(`${service.name} health status:`, healthResponse.status)
      console.log(`${service.name} health response:`, await healthResponse.text())
      
    } catch (error) {
      console.error(`❌ ${service.name} service failed:`, error)
    }
  }

  // Test specific API endpoints
  try {
    console.log('Testing property API...')
    const propertyResponse = await fetch(`${process.env.NEXT_PUBLIC_PROPERTY_SERVICE_URL}/api/properties`)
    console.log('Property API status:', propertyResponse.status)
    
    if (propertyResponse.ok) {
      const properties = await propertyResponse.json()
      console.log('Properties loaded:', properties.length || 'No properties')
    } else {
      console.error('Property API error:', await propertyResponse.text())
    }
  } catch (error) {
    console.error('Property API failed:', error)
  }
}

// Call this function in your app to test
// Add this to your homepage component temporarily:
// useEffect(() => {
//   testBackendConnectivity()
// }, [])