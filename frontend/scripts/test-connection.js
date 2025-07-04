const https = require('https');

const services = [
  {
    name: 'Property Service',
    url: 'https://property-production.up.railway.app/api/properties',
  },
  {
    name: 'Booking Service', 
    url: 'https://booking-production-e88d.up.railway.app/ping',
  },
  {
    name: 'Search Service',
    url: 'https://search-production-3a88.up.railway.app/api/search/health',
  },
  {
    name: 'User Service',
    url: 'https://user-production-cf16.up.railway.app/ping',
  }
];

async function testService(service) {
  return new Promise((resolve) => {
    const request = https.get(service.url, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        console.log(`✅ ${service.name}: ${response.statusCode} - ${data.substring(0, 100)}...`);
        resolve({ name: service.name, status: 'success', code: response.statusCode });
      });
    });
    
    request.on('error', (error) => {
      console.log(`❌ ${service.name}: Error - ${error.message}`);
      resolve({ name: service.name, status: 'error', error: error.message });
    });
    
    request.setTimeout(10000, () => {
      console.log(`⏰ ${service.name}: Timeout`);
      request.destroy();
      resolve({ name: service.name, status: 'timeout' });
    });
  });
}

async function testAllServices() {
  console.log('🔍 Testing backend services...\n');
  
  const results = await Promise.all(services.map(testService));
  
  console.log('\n📊 Summary:');
  results.forEach(result => {
    const status = result.status === 'success' ? '✅' : result.status === 'timeout' ? '⏰' : '❌';
    console.log(`${status} ${result.name}: ${result.status}`);
  });
  
  const successCount = results.filter(r => r.status === 'success').length;
  console.log(`\n🎯 ${successCount}/${results.length} services are working`);
}

testAllServices().catch(console.error);