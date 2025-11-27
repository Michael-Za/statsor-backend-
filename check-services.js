const http = require('http');

// Services to check
const services = [
  { name: 'Frontend', url: 'http://localhost:3006', path: '/' },
  { name: 'Backend API', url: 'http://localhost:3001', path: '/health' },
  { name: 'AI Assistant Backend', url: 'http://localhost:5000', path: '/health' }
];

async function checkService(service) {
  return new Promise((resolve) => {
    const url = new URL(service.path, service.url);
    const req = http.get(url, (res) => {
      resolve({
        name: service.name,
        status: res.statusCode === 200 ? 'OK' : `ERROR (${res.statusCode})`,
        url: service.url
      });
    });
    
    req.on('error', (err) => {
      resolve({
        name: service.name,
        status: `ERROR (${err.message})`,
        url: service.url
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        name: service.name,
        status: 'ERROR (Timeout)',
        url: service.url
      });
    });
  });
}

async function checkAllServices() {
  console.log('Checking services...\n');
  
  const results = await Promise.all(services.map(checkService));
  
  results.forEach(result => {
    const statusIcon = result.status === 'OK' ? '✓' : '✗';
    console.log(`${statusIcon} ${result.name}: ${result.status}`);
    console.log(`  URL: ${result.url}\n`);
  });
  
  const allOk = results.every(r => r.status === 'OK');
  if (allOk) {
    console.log('All services are running correctly! 🎉');
  } else {
    console.log('Some services are not running. Please check the errors above.');
    console.log('\nTo fix this, please follow the AI_ASSISTANT_STARTUP_GUIDE.md');
  }
}

checkAllServices();