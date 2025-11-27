const { exec } = require('child_process');

// Services to check
const services = [
  { name: 'Frontend', port: 3006, expected: 'running' },
  { name: 'Backend API', port: 3001, expected: 'running' },
  { name: 'AI Assistant Backend', port: 5000, expected: 'running' }
];

function checkDockerServices() {
  console.log('Checking Docker services...\n');
  
  exec('docker-compose ps', (error, stdout, stderr) => {
    if (error) {
      console.error('Error checking Docker services:', error.message);
      return;
    }
    
    if (stderr) {
      console.error('STDERR:', stderr);
      return;
    }
    
    console.log('Docker Compose Services Status:');
    console.log('==============================');
    console.log(stdout);
    
    // Check if all services are running
    const lines = stdout.split('\n');
    const runningServices = lines.filter(line => line.includes('Up')).length;
    const totalServices = lines.filter(line => line.trim() !== '' && !line.includes('Name')).length - 1; // -1 for header
    
    console.log(`\nServices Running: ${runningServices}/${totalServices}`);
    
    if (runningServices === totalServices && totalServices > 0) {
      console.log('\n✅ All services are running correctly!');
      console.log('\nYou can access the application at: http://localhost:3006');
    } else if (runningServices > 0) {
      console.log('\n⚠️  Some services are not running. Check the status above.');
    } else {
      console.log('\n❌ No services are running. Please start the services with:');
      console.log('   docker-compose up -d');
    }
  });
}

checkDockerServices();