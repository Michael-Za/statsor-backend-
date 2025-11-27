const { exec } = require('child_process');
const fs = require('fs');

console.log('===============================================');
console.log('StatSor AI Assistant - Complete Fix Implementation');
console.log('===============================================');
console.log();

// Function to execute commands
function executeCommand(command, successMessage, errorMessage) {
  return new Promise((resolve, reject) => {
    console.log(`Executing: ${command}`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ ${errorMessage}: ${error.message}`);
        resolve(false);
        return;
      }
      
      if (stderr) {
        console.warn(`⚠️  Warning: ${stderr}`);
      }
      
      console.log(`✅ ${successMessage}`);
      console.log(stdout);
      resolve(true);
    });
  });
}

// Function to check if files exist
function checkFiles() {
  const requiredFiles = [
    'src/components/AIAssistantSection.tsx',
    'src/services/aiChatService.ts',
    'AI_ASSISTANT_STARTUP_GUIDE.md',
    'docker-compose.yml'
  ];
  
  console.log('Checking required files...');
  
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`❌ ${file} not found`);
      return false;
    }
  }
  
  return true;
}

async function implementFixes() {
  try {
    // Check if files exist
    if (!checkFiles()) {
      console.log('❌ Required files are missing. Please ensure you are in the correct directory.');
      process.exit(1);
    }
    
    console.log();
    console.log('1. Checking if Docker is installed...');
    const dockerInstalled = await executeCommand(
      'docker --version',
      'Docker is installed',
      'Docker is not installed'
    );
    
    if (!dockerInstalled) {
      console.log('❌ Docker is required for this fix. Please install Docker Desktop.');
      console.log('   Download from: https://www.docker.com/products/docker-desktop');
      process.exit(1);
    }
    
    console.log();
    console.log('2. Building and starting all services with Docker...');
    const servicesStarted = await executeCommand(
      'docker-compose up --build -d',
      'Docker services started successfully',
      'Failed to start Docker services'
    );
    
    if (!servicesStarted) {
      console.log('❌ Failed to start services. Please check Docker is running and you have sufficient permissions.');
      process.exit(1);
    }
    
    console.log();
    console.log('3. Waiting for services to initialize...');
    await new Promise(resolve => setTimeout(resolve, 15000)); // Wait 15 seconds
    
    console.log();
    console.log('4. Verifying services are running...');
    await executeCommand(
      'docker-compose ps',
      'Services status displayed above',
      'Failed to check services status'
    );
    
    console.log();
    console.log('===============================================');
    console.log('FIX IMPLEMENTATION COMPLETE');
    console.log('===============================================');
    console.log();
    console.log('Services should now be accessible at:');
    console.log('🔵 Frontend: http://localhost:3006');
    console.log('🟢 Backend API: http://localhost:3001');
    console.log('🤖 AI Assistant Backend: http://localhost:5000');
    console.log();
    console.log('To test the AI assistant:');
    console.log('1. Open your browser and go to http://localhost:3006');
    console.log('2. Navigate to the AI Assistant section');
    console.log('3. Try sending a message like "Analyze my team data"');
    console.log();
    console.log('To stop services later, run: docker-compose down');
    console.log();
    console.log('For manual installation, see AI_ASSISTANT_STARTUP_GUIDE.md');
    
  } catch (error) {
    console.error('❌ Unexpected error during fix implementation:', error.message);
    process.exit(1);
  }
}

// Run the implementation
implementFixes();