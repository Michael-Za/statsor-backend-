import os
import subprocess
import threading
import time
import requests

def start_chatbot():
    """Start the chatbot service"""
    print("Starting chatbot service...")
    try:
        # Change to chatbot directory
        os.chdir("chatbot")
        
        # Start the chatbot
        process = subprocess.Popen(
            ["python", "app.py"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        os.chdir("..")  # Go back to parent directory
        return process
    except Exception as e:
        print(f"Error starting chatbot: {e}")
        return None

def start_backend():
    """Start the backend service"""
    print("Starting backend service...")
    try:
        # Change to backend directory
        os.chdir("backend")
        
        # Start the backend
        process = subprocess.Popen(
            ["npm", "start"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        os.chdir("..")  # Go back to parent directory
        return process
    except Exception as e:
        print(f"Error starting backend: {e}")
        return None

def check_service(url, service_name, timeout=30):
    """Check if a service is running"""
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print(f"✓ {service_name} is running")
                return True
        except:
            time.sleep(2)
    
    print(f"✗ {service_name} failed to start within {timeout} seconds")
    return False

def main():
    """Main function to start all services"""
    print("Starting StatSor Services...")
    print("=" * 50)
    
    # Start services
    chatbot_process = start_chatbot()
    backend_process = start_backend()
    
    if not chatbot_process or not backend_process:
        print("Failed to start one or more services")
        return
    
    print("\nWaiting for services to start...")
    print("-" * 30)
    
    # Check if services are running
    chatbot_ready = check_service("http://localhost:5000/health", "Chatbot")
    backend_ready = check_service("http://localhost:3001/health", "Backend")
    
    print("\n" + "=" * 50)
    if chatbot_ready and backend_ready:
        print("🎉 All services are running successfully!")
        print("\nService URLs:")
        print("  Chatbot: http://localhost:5000")
        print("  Backend: http://localhost:3001")
        print("\nPress Ctrl+C to stop services")
        
        try:
            # Keep the script running
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n\nStopping services...")
            chatbot_process.terminate()
            backend_process.terminate()
            print("Services stopped.")
    else:
        print("❌ Some services failed to start")
        print("Check the logs above for more information")

if __name__ == "__main__":
    main()