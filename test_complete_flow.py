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
    
    # Check backend
    try:
        backend_response = requests.get('http://localhost:3001/health', timeout=5)
        backend_running = backend_response.status_code == 200
        backend_data = backend_response.json()
        print(f"  Backend (port 3001): {'✓ Running' if backend_running else '✗ Not running'}")
        if backend_running:
            print(f"    Status: {backend_data.get('status', 'Unknown')}")
            print(f"    Environment: {backend_data.get('environment', 'Unknown')}")
    except Exception as e:
        backend_running = False
        print(f"  Backend (port 3001): ✗ Not running ({str(e)})")
    
    # Check Python chatbot service
    try:
        chatbot_response = requests.get('http://localhost:5000/health', timeout=5)
        chatbot_running = chatbot_response.status_code == 200
        chatbot_data = chatbot_response.json()
        print(f"  Chatbot (port 5000): {'✓ Running' if chatbot_running else '✗ Not running'}")
        if chatbot_running:
            print(f"    Status: {chatbot_data.get('status', 'Unknown')}")
            print(f"    Service: {chatbot_data.get('service', 'Unknown')}")
    except Exception as e:
        chatbot_running = False
        print(f"  Chatbot (port 5000): ✗ Not running ({str(e)})")
    
    # Overall service status
    all_services_running = backend_running and chatbot_running
    print(f"\nOverall service status: {'✓ All required services running' if all_services_running else '✗ Some services not running'}")
    
    if not all_services_running:
        print("Cannot proceed with flow test - some services are not running")
        return False
    
    # Test 2: Test the backend proxy to chatbot connection
    print("\nTest 2: Testing backend proxy to chatbot connection")
    try:
        # Test direct chatbot endpoint first
        test_message = "Tell me about my players"
        direct_response = requests.post(
            'http://localhost:5000/api/chat',
            json={"message": test_message, "context": {}},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if direct_response.status_code == 200:
            direct_data = direct_response.json()
            print("  Direct chatbot connection: ✓ Working")
            response_text = direct_data.get('response', 'No response')
            print(f"    Response preview: {response_text[:100]}...")
        else:
            print(f"  Direct chatbot connection: ✗ Not working (Status: {direct_response.status_code})")
            print(f"    Error: {direct_response.text}")
            return False
    except Exception as e:
        print(f"  Direct chatbot connection: ✗ Not working (Error: {str(e)})")
        return False
    
    # Test 3: Test Groq API integration with a simple query
    print("\nTest 3: Testing Groq API integration")
    try:
        # Test direct chatbot endpoint with a query that should trigger Groq
        groq_test_message = "Hello, please give me a short greeting"
        groq_response = requests.post(
            'http://localhost:5000/api/chat',
            json={"message": groq_test_message, "context": {}},
            headers={"Content-Type": "application/json"},
            timeout=15
        )
        
        if groq_response.status_code == 200:
            groq_data = groq_response.json()
            print("  Groq API integration: ✓ Working")
            response_text = groq_data.get('response', 'No response')
            print(f"    Response: {response_text}")
        else:
            print(f"  Groq API integration: ✗ Not working (Status: {groq_response.status_code})")
            print(f"    Error: {groq_response.text}")
            return False
    except Exception as e:
        print(f"  Groq API integration: ✗ Not working (Error: {str(e)})")
        return False
    
    # Test 4: Test football-specific queries
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
                headers={"Content-Type": "application/json"},
                timeout=10
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
    
    # Test 5: Test agent actions (queries that should trigger Groq API)
    print("\nTest 5: Testing agent actions")
    agent_queries = [
        "Add a new player named John Doe as a forward",
        "Create a match against Manchester United next week",
        "Update player Messi's goals to 30"
    ]
    
    successful_agent_queries = 0
    for query in agent_queries:
        try:
            response = requests.post(
                'http://localhost:5000/api/chat',
                json={"message": query, "context": {}},
                headers={"Content-Type": "application/json"},
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                response_text = data.get('response', '')
                intent = data.get('intent', 'unknown')
                print(f"  Agent query '{query[:30]}...': ✓ Success")
                print(f"    Intent: {intent}")
                print(f"    Response preview: {response_text[:50]}...")
                successful_agent_queries += 1
            else:
                print(f"  Agent query '{query[:30]}...': ✗ Failed (Status: {response.status_code})")
        except Exception as e:
            print(f"  Agent query '{query[:30]}...': ✗ Failed (Error: {str(e)})")
    
    print(f"\nAgent queries: {successful_agent_queries}/{len(agent_queries)} successful")
    
    # Overall result
    print("\n" + "=" * 50)
    print("COMPLETE FLOW TEST RESULTS:")
    print(f"  Service status: {'✓ All services running' if all_services_running else '✗ Some services not running'}")
    print(f"  Direct chatbot: {'✓ Working' if direct_response.status_code == 200 else '✗ Not working'}")
    print(f"  Groq integration: {'✓ Working' if groq_response.status_code == 200 else '✗ Not working'}")
    print(f"  Football queries: {successful_queries}/{len(football_queries)} successful")
    print(f"  Agent queries: {successful_agent_queries}/{len(agent_queries)} successful")
    
    overall_success = (
        all_services_running and 
        direct_response.status_code == 200 and 
        groq_response.status_code == 200 and
        successful_queries > 0 and
        successful_agent_queries > 0
    )
    
    print(f"\nOVERALL RESULT: {'🎉 ALL TESTS PASSED' if overall_success else '❌ SOME TESTS FAILED'}")
    return overall_success

if __name__ == "__main__":
    success = test_complete_flow()
    exit(0 if success else 1)