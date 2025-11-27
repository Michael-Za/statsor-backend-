#!/usr/bin/env python3
"""
Test script to verify the complete AI assistant flow:
Frontend -> Backend -> Python Chatbot -> Groq API
"""

import requests
import json
import time

def test_complete_flow():
    """Test the complete AI assistant flow"""
    print("Testing complete AI assistant flow...")
    print("=" * 50)
    
    # Test 1: Check if all services are running
    print("Test 1: Checking if all services are running")
    
    # Check frontend (Vite dev server)
    try:
        frontend_response = requests.get('http://localhost:3009')
        frontend_running = frontend_response.status_code == 200
        print(f"  Frontend (port 3009): {'✓ Running' if frontend_running else '✗ Not running'}")
    except:
        frontend_running = False
        print("  Frontend (port 3009): ✗ Not running")
    
    # Check backend
    try:
        backend_response = requests.get('http://localhost:3001/health')
        backend_running = backend_response.status_code == 200
        backend_data = backend_response.json()
        print(f"  Backend (port 3001): {'✓ Running' if backend_running else '✗ Not running'}")
        if backend_running:
            print(f"    Status: {backend_data.get('status', 'Unknown')}")
            print(f"    Environment: {backend_data.get('environment', 'Unknown')}")
    except:
        backend_running = False
        print("  Backend (port 3001): ✗ Not running")
    
    # Check Python chatbot service
    try:
        chatbot_response = requests.get('http://localhost:5000/health')
        chatbot_running = chatbot_response.status_code == 200
        chatbot_data = chatbot_response.json()
        print(f"  Chatbot (port 5000): {'✓ Running' if chatbot_running else '✗ Not running'}")
        if chatbot_running:
            print(f"    Status: {chatbot_data.get('status', 'Unknown')}")
            print(f"    Service: {chatbot_data.get('service', 'Unknown')}")
    except:
        chatbot_running = False
        print("  Chatbot (port 5000): ✗ Not running")
    
    # Overall service status
    all_services_running = frontend_running and backend_running and chatbot_running
    print(f"\nOverall service status: {'✓ All services running' if all_services_running else '✗ Some services not running'}")
    
    if not all_services_running:
        print("Cannot proceed with flow test - some services are not running")
        return False
    
    # Test 2: Test the backend proxy to chatbot connection
    print("\nTest 2: Testing backend proxy to chatbot connection")
    try:
        # This would normally require authentication, but we'll test the connection itself
        test_message = "Tell me about my players"
        proxy_response = requests.post(
            'http://localhost:3001/api/v1/ai-proxy/chat',
            json={"message": test_message, "context": {}},
            headers={"Content-Type": "application/json"}
        )
        
        if proxy_response.status_code == 200:
            proxy_data = proxy_response.json()
            print("  Backend proxy to chatbot: ✓ Connection successful")
            print(f"    Success: {proxy_data.get('success', False)}")
            if proxy_data.get('success'):
                ai_data = proxy_data.get('data', {})
                print(f"    Response type: {type(ai_data)}")
                if isinstance(ai_data, dict) and 'response' in ai_data:
                    response_text = ai_data['response']
                    print(f"    Response preview: {response_text[:100]}...")
                else:
                    print(f"    Response data: {ai_data}")
            else:
                print(f"    Error: {proxy_data.get('error', 'Unknown error')}")
        else:
            print(f"  Backend proxy to chatbot: ✗ Connection failed (Status: {proxy_response.status_code})")
            print(f"    Error: {proxy_response.text}")
            return False
    except Exception as e:
        print(f"  Backend proxy to chatbot: ✗ Connection failed (Error: {str(e)})")
        return False
    
    # Test 3: Test Groq API integration
    print("\nTest 3: Testing Groq API integration")
    try:
        # Test direct chatbot endpoint
        chatbot_test_response = requests.post(
            'http://localhost:5000/api/chat',
            json={"message": "Hello, this is a test message. Please respond with a short greeting.", "context": {}},
            headers={"Content-Type": "application/json"}
        )
        
        if chatbot_test_response.status_code == 200:
            chatbot_test_data = chatbot_test_response.json()
            print("  Chatbot Groq integration: ✓ Working")
            response_text = chatbot_test_data.get('response', 'No response')
            print(f"    Response: {response_text}")
        else:
            print(f"  Chatbot Groq integration: ✗ Not working (Status: {chatbot_test_response.status_code})")
            print(f"    Error: {chatbot_test_response.text}")
            return False
    except Exception as e:
        print(f"  Chatbot Groq integration: ✗ Not working (Error: {str(e)})")
        return False
    
    # Test 4: Test specific football-related queries
    print("\nTest 4: Testing football-specific queries")
    football_queries = [
        "Tell me about my players",
        "What's our team formation?",
        "How did we do in our last match?",
        "Suggest a training plan for next week"
    ]
    
    successful_queries = 0
    for query in football_queries:
        try:
            response = requests.post(
                'http://localhost:5000/api/chat',
                json={"message": query, "context": {}},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                response_text = data.get('response', '')
                intent = data.get('intent', 'unknown')
                print(f"  Query '{query[:30]}...': ✓ Success")
                print(f"    Intent: {intent}")
                print(f"    Response preview: {response_text[:50]}...")
                successful_queries += 1
            else:
                print(f"  Query '{query[:30]}...': ✗ Failed (Status: {response.status_code})")
        except Exception as e:
            print(f"  Query '{query[:30]}...': ✗ Failed (Error: {str(e)})")
    
    print(f"\nFootball queries: {successful_queries}/{len(football_queries)} successful")
    
    # Overall result
    print("\n" + "=" * 50)
    print("COMPLETE FLOW TEST RESULTS:")
    print(f"  Service status: {'✓ All services running' if all_services_running else '✗ Some services not running'}")
    print(f"  Backend proxy: {'✓ Working' if proxy_response.status_code == 200 else '✗ Not working'}")
    print(f"  Groq integration: {'✓ Working' if chatbot_test_response.status_code == 200 else '✗ Not working'}")
    print(f"  Football queries: {successful_queries}/{len(football_queries)} successful")
    
    overall_success = (
        all_services_running and 
        proxy_response.status_code == 200 and 
        chatbot_test_response.status_code == 200 and
        successful_queries > 0
    )
    
    print(f"\nOVERALL RESULT: {'🎉 ALL TESTS PASSED' if overall_success else '❌ SOME TESTS FAILED'}")
    return overall_success

if __name__ == "__main__":
    success = test_complete_flow()
    exit(0 if success else 1)