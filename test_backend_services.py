import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_backend_services():
    """Test backend services to ensure they're working with real data"""
    backend_url = os.getenv('BACKEND_API_URL', 'http://localhost:3001')
    
    print(f"Testing backend services at: {backend_url}")
    print("=" * 50)
    
    # Test 1: Health check
    print("1. Testing backend health check...")
    try:
        response = requests.get(f"{backend_url}/health")
        if response.status_code == 200:
            print("✓ Backend health check passed")
            print(f"  Status: {response.json().get('status')}")
        else:
            print(f"✗ Backend health check failed with status {response.status_code}")
    except Exception as e:
        print(f"✗ Backend health check failed with error: {e}")
    
    # Test 2: Database health check
    print("\n2. Testing database connection...")
    try:
        response = requests.get(f"{backend_url}/health/db")
        if response.status_code == 200:
            print("✓ Database health check passed")
            print(f"  Status: {response.json().get('status')}")
            print(f"  Database: {response.json().get('database')}")
        else:
            print(f"✗ Database health check failed with status {response.status_code}")
    except Exception as e:
        print(f"✗ Database health check failed with error: {e}")
    
    # Test 3: Redis health check
    print("\n3. Testing Redis connection...")
    try:
        response = requests.get(f"{backend_url}/health/redis")
        if response.status_code == 200:
            print("✓ Redis health check passed")
            print(f"  Status: {response.json().get('status')}")
            print(f"  Redis: {response.json().get('redis')}")
        else:
            print(f"✗ Redis health check failed with status {response.status_code}")
    except Exception as e:
        print(f"✗ Redis health check failed with error: {e}")
    
    # Test 4: API documentation
    print("\n4. Testing API documentation...")
    try:
        response = requests.get(f"{backend_url}/api/docs")
        if response.status_code == 200:
            print("✓ API documentation endpoint accessible")
            docs = response.json()
            print(f"  Title: {docs.get('title')}")
            print(f"  Version: {docs.get('version')}")
        else:
            print(f"✗ API documentation failed with status {response.status_code}")
    except Exception as e:
        print(f"✗ API documentation test failed with error: {e}")
    
    # Test 5: Players endpoint (authentication required)
    print("\n5. Testing players endpoint...")
    try:
        response = requests.get(f"{backend_url}/api/v1/players")
        if response.status_code == 401:
            print("✓ Players endpoint requires authentication (as expected)")
        elif response.status_code == 200:
            print("✓ Players endpoint accessible")
            data = response.json()
            print(f"  Players count: {len(data.get('players', []))}")
        else:
            print(f"✗ Players endpoint failed with status {response.status_code}")
    except Exception as e:
        print(f"✗ Players endpoint test failed with error: {e}")

def test_email_service():
    """Test email service configuration"""
    print("\n" + "=" * 50)
    print("Testing Email Service Configuration...")
    
    # Check if SMTP configuration is present
    smtp_host = os.getenv('SMTP_HOST')
    smtp_user = os.getenv('SMTP_USER')
    smtp_pass = os.getenv('SMTP_PASS')
    
    if smtp_host and smtp_user and smtp_pass:
        print("✓ SMTP configuration found")
        print(f"  Host: {smtp_host}")
        print(f"  User: {smtp_user}")
        # Don't print password for security
        print("  Password: *** configured ***")
    else:
        print("⚠ SMTP configuration incomplete")
        print(f"  Host: {smtp_host or 'NOT SET'}")
        print(f"  User: {smtp_user or 'NOT SET'}")
        print(f"  Password: {'SET' if smtp_pass else 'NOT SET'}")

def test_supabase_config():
    """Test Supabase configuration"""
    print("\n" + "=" * 50)
    print("Testing Supabase Configuration...")
    
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
    
    if supabase_url and supabase_key:
        print("✓ Supabase configuration found")
        print(f"  URL: {supabase_url}")
        # Don't print key for security
        print("  Key: *** configured ***")
    else:
        print("⚠ Supabase configuration incomplete")
        print(f"  URL: {supabase_url or 'NOT SET'}")
        print(f"  Key: {'SET' if supabase_key else 'NOT SET'}")

def test_google_oauth():
    """Test Google OAuth configuration"""
    print("\n" + "=" * 50)
    print("Testing Google OAuth Configuration...")
    
    google_client_id = os.getenv('GOOGLE_CLIENT_ID')
    google_client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
    
    if google_client_id and google_client_secret:
        print("✓ Google OAuth configuration found")
        print(f"  Client ID: {google_client_id}")
        # Don't print secret for security
        print("  Client Secret: *** configured ***")
    else:
        print("⚠ Google OAuth configuration incomplete")
        print(f"  Client ID: {google_client_id or 'NOT SET'}")
        print(f"  Client Secret: {'SET' if google_client_secret else 'NOT SET'}")

if __name__ == "__main__":
    print("Backend Services Test Suite")
    print("=" * 50)
    
    # Test backend services
    test_backend_services()
    
    # Test email service
    test_email_service()
    
    # Test Supabase configuration
    test_supabase_config()
    
    # Test Google OAuth configuration
    test_google_oauth()
    
    print("\n" + "=" * 50)
    print("Backend services test completed!")