#!/usr/bin/env python3
"""
Test script for the AI Chat Assistant
This script helps verify that the chat functionality works correctly
"""

import requests
import json
import time
from datetime import datetime

def test_health_endpoint():
    """Test the health check endpoint"""
    print("Testing health endpoint...")
    try:
        response = requests.get('http://localhost:5000/health')
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure the Flask app is running.")
        return False

def test_webpage_access():
    """Test if the main webpage is accessible"""
    print("\nTesting webpage access...")
    try:
        response = requests.get('http://localhost:5000/')
        if response.status_code == 200:
            print("✅ Webpage is accessible")
            return True
        else:
            print(f"❌ Webpage access failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Could not access webpage. Make sure the Flask app is running.")
        return False

def test_mock_supervisor():
    """Test the mock supervisor functionality"""
    print("\nTesting mock supervisor...")
    
    # Import the mock supervisor
    try:
        from app import MockSupervisor
        supervisor = MockSupervisor()
        
        # Test with thoughts enabled
        print("Testing with thoughts enabled...")
        thoughts_count = 0
        final_response_received = False
        
        for response in supervisor.process_user_input("Hello, how are you?", show_thoughts=True):
            if response['type'] == 'thought':
                thoughts_count += 1
                print(f"  Thought {thoughts_count}: {response['content']}")
            elif response['type'] == 'final_response':
                final_response_received = True
                print(f"  Final response: {response['content']}")
        
        if thoughts_count > 0 and final_response_received:
            print("✅ Mock supervisor with thoughts works correctly")
        else:
            print("❌ Mock supervisor with thoughts failed")
            return False
        
        # Test without thoughts
        print("\nTesting without thoughts...")
        thoughts_count = 0
        final_response_received = False
        
        for response in supervisor.process_user_input("What's the weather like?", show_thoughts=False):
            if response['type'] == 'thought':
                thoughts_count += 1
            elif response['type'] == 'final_response':
                final_response_received = True
                print(f"  Final response: {response['content']}")
        
        if thoughts_count == 0 and final_response_received:
            print("✅ Mock supervisor without thoughts works correctly")
        else:
            print("❌ Mock supervisor without thoughts failed")
            return False
        
        return True
        
    except ImportError as e:
        print(f"❌ Could not import MockSupervisor: {e}")
        return False
    except Exception as e:
        print(f"❌ Mock supervisor test failed: {e}")
        return False

def test_response_generation():
    """Test different types of user inputs"""
    print("\nTesting response generation...")
    
    try:
        from app import MockSupervisor
        supervisor = MockSupervisor()
        
        test_inputs = [
            "Hello there!",
            "Can you help me with programming?",
            "What's the weather like today?",
            "Thank you for your help",
            "This is a very long message to test how the system handles longer inputs and whether it can process them correctly without any issues.",
            ""  # Empty input
        ]
        
        for i, user_input in enumerate(test_inputs, 1):
            print(f"\nTest {i}: '{user_input[:30]}{'...' if len(user_input) > 30 else ''}'")
            
            try:
                responses = list(supervisor.process_user_input(user_input, show_thoughts=False))
                
                if not responses:
                    print("  ❌ No responses received")
                    continue
                
                final_response = None
                for response in responses:
                    if response['type'] == 'final_response':
                        final_response = response['content']
                        break
                
                if final_response:
                    print(f"  ✅ Response: {final_response[:100]}{'...' if len(final_response) > 100 else ''}")
                else:
                    print("  ❌ No final response received")
                    
            except Exception as e:
                print(f"  ❌ Error: {e}")
        
        return True
        
    except Exception as e:
        print(f"❌ Response generation test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 AI Chat Assistant - Test Suite")
    print("=" * 50)
    
    tests = [
        ("Health Endpoint", test_health_endpoint),
        ("Webpage Access", test_webpage_access),
        ("Mock Supervisor", test_mock_supervisor),
        ("Response Generation", test_response_generation)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            if test_func():
                passed += 1
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
    
    print(f"\n{'='*50}")
    print(f"Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! The chat assistant is working correctly.")
        print("\nNext steps:")
        print("1. Open http://localhost:5000 in your browser")
        print("2. Test the chat interface manually")
        print("3. Replace MockSupervisor with your actual supervisor")
        print("4. Follow the integration guide in INTEGRATION_GUIDE.md")
    else:
        print("⚠️  Some tests failed. Please check the errors above.")
        print("\nTroubleshooting:")
        print("1. Make sure the Flask app is running (python app.py)")
        print("2. Check that all dependencies are installed")
        print("3. Verify the server is accessible at http://localhost:5000")

if __name__ == "__main__":
    main()