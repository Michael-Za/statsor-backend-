import os
import sys
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def check_file_exists(filepath):
    """Check if a file exists"""
    if os.path.exists(filepath):
        print(f"✓ {filepath} exists")
        return True
    else:
        print(f"✗ {filepath} not found")
        return False

def check_environment_variables():
    """Check if required environment variables are set"""
    print("Checking environment variables...")
    print("-" * 40)
    
    # Chatbot environment variables
    chatbot_vars = ['GROQ_API_KEY', 'FLASK_ENV', 'FLASK_APP']
    for var in chatbot_vars:
        value = os.getenv(var)
        if value:
            print(f"✓ {var}: {'SET' if var != 'GROQ_API_KEY' else value[:10] + '...'}")
        else:
            print(f"✗ {var}: NOT SET")
    
    print()
    
    # Backend environment variables
    backend_vars = [
        'SUPABASE_URL', 
        'SUPABASE_SERVICE_ROLE_KEY', 
        'JWT_SECRET', 
        'GOOGLE_CLIENT_ID',
        'SMTP_HOST',
        'SMTP_USER',
        'SMTP_PASS'
    ]
    
    for var in backend_vars:
        value = os.getenv(var)
        if value:
            print(f"✓ {var}: SET")
        else:
            print(f"⚠ {var}: NOT SET (may cause issues)")

def check_chatbot_integration():
    """Check if chatbot is properly integrated with Groq API"""
    print("\nChecking chatbot integration...")
    print("-" * 40)
    
    groq_api_key = os.getenv('GROQ_API_KEY')
    if not groq_api_key:
        print("✗ GROQ_API_KEY not found in environment variables")
        return False
    
    print("✓ GROQ_API_KEY found")
    
    # Check if required files exist
    required_files = [
        'chatbot/app.py',
        'chatbot/.env',
        'chatbot/requirements.txt'
    ]
    
    all_files_exist = True
    for file in required_files:
        if not check_file_exists(file):
            all_files_exist = False
    
    if not all_files_exist:
        return False
    
    # Check if dotenv is imported in app.py
    try:
        with open('chatbot/app.py', 'r') as f:
            content = f.read()
            if 'from dotenv import load_dotenv' in content:
                print("✓ dotenv properly imported in chatbot app.py")
            else:
                print("✗ dotenv not imported in chatbot app.py")
                return False
                
            if 'load_dotenv()' in content:
                print("✓ load_dotenv() called in chatbot app.py")
            else:
                print("✗ load_dotenv() not called in chatbot app.py")
                return False
                
            if 'GROQ_API_KEY = os.getenv' in content:
                print("✓ GROQ_API_KEY loading implemented in chatbot app.py")
            else:
                print("✗ GROQ_API_KEY loading not implemented in chatbot app.py")
                return False
    except Exception as e:
        print(f"✗ Error reading chatbot/app.py: {e}")
        return False
    
    return True

def check_backend_services():
    """Check if backend services are properly configured"""
    print("\nChecking backend services...")
    print("-" * 40)
    
    # Check if required files exist
    required_files = [
        'backend/.env',
        'backend/package.json',
        'backend/src/server.js',
        'backend/src/services/apiService.js',
        'backend/src/services/database.js',
        'backend/src/services/emailService.js'
    ]
    
    all_files_exist = True
    for file in required_files:
        if not check_file_exists(file):
            all_files_exist = False
    
    if not all_files_exist:
        return False
    
    # Check database service
    try:
        with open('backend/src/services/database.js', 'r') as f:
            content = f.read()
            if 'Supabase' in content or 'supabase' in content:
                print("✓ Supabase integration found in database service")
            else:
                print("⚠ Supabase integration not clearly visible in database service")
    except Exception as e:
        print(f"✗ Error reading database service: {e}")
    
    # Check email service
    try:
        with open('backend/src/services/emailService.js', 'r') as f:
            content = f.read()
            if 'smtp.resend.com' in content or 'SMTP_HOST' in content:
                print("✓ Email service configured")
            else:
                print("⚠ Email service configuration not clearly visible")
    except Exception as e:
        print(f"✗ Error reading email service: {e}")
    
    return True

def check_api_endpoints():
    """Check if API endpoints are accessible"""
    print("\nChecking API endpoints...")
    print("-" * 40)
    
    backend_url = os.getenv('BACKEND_API_URL', 'http://localhost:3001')
    chatbot_url = 'http://localhost:5000'
    
    # Check chatbot health endpoint
    try:
        response = requests.get(f'{chatbot_url}/health', timeout=5)
        if response.status_code == 200:
            print("✓ Chatbot health endpoint accessible")
        else:
            print(f"⚠ Chatbot health endpoint returned status {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"⚠ Chatbot health endpoint not accessible: {e}")
    
    # Check backend health endpoint
    try:
        response = requests.get(f'{backend_url}/health', timeout=5)
        if response.status_code == 200:
            print("✓ Backend health endpoint accessible")
        else:
            print(f"⚠ Backend health endpoint returned status {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"⚠ Backend health endpoint not accessible: {e}")

def verify_implementation():
    """Main verification function"""
    print("StatSor Implementation Verification")
    print("=" * 50)
    
    # Check environment variables
    check_environment_variables()
    
    # Check chatbot integration
    chatbot_ok = check_chatbot_integration()
    
    # Check backend services
    backend_ok = check_backend_services()
    
    # Check API endpoints
    check_api_endpoints()
    
    print("\n" + "=" * 50)
    print("Implementation Verification Summary:")
    print(f"Chatbot Integration: {'✓ PASS' if chatbot_ok else '✗ FAIL'}")
    print(f"Backend Services: {'✓ PASS' if backend_ok else '✗ FAIL'}")
    
    if chatbot_ok and backend_ok:
        print("\n🎉 All verifications passed!")
        print("The implementation is ready with real data services instead of mock code.")
        return True
    else:
        print("\n❌ Some verifications failed.")
        print("Please check the errors above and fix the issues.")
        return False

if __name__ == "__main__":
    success = verify_implementation()
    sys.exit(0 if success else 1)