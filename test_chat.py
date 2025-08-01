#!/usr/bin/env python3
"""
Test script for the chat GUI functionality.
This script tests the MockSupervisor to ensure it works correctly.
"""

import time
from datetime import datetime
from app import MockSupervisor

def test_supervisor():
    """Test the MockSupervisor functionality"""
    print("Testing MockSupervisor...")
    
    supervisor = MockSupervisor()
    
    # Test without thoughts
    print("\n1. Testing without thoughts:")
    for response in supervisor.process_user_input("Hello, how are you?", show_thoughts=False):
        print(f"  Type: {response['type']}")
        print(f"  Content: {response['content']}")
        print(f"  Timestamp: {response['timestamp']}")
        print()
    
    # Test with thoughts
    print("\n2. Testing with thoughts:")
    for response in supervisor.process_user_input("What is the weather like?", show_thoughts=True):
        print(f"  Type: {response['type']}")
        print(f"  Content: {response['content']}")
        print(f"  Timestamp: {response['timestamp']}")
        print()

def test_message_format():
    """Test message format validation"""
    print("\n3. Testing message format:")
    
    supervisor = MockSupervisor()
    
    for response in supervisor.process_user_input("Test message", show_thoughts=True):
        # Check required fields
        required_fields = ['type', 'content', 'timestamp']
        for field in required_fields:
            if field not in response:
                print(f"  ERROR: Missing required field '{field}'")
                return False
        
        # Check field types
        if not isinstance(response['type'], str):
            print(f"  ERROR: 'type' should be string, got {type(response['type'])}")
            return False
        
        if not isinstance(response['content'], str):
            print(f"  ERROR: 'content' should be string, got {type(response['content'])}")
            return False
        
        # Check timestamp format
        try:
            datetime.fromisoformat(response['timestamp'])
        except ValueError:
            print(f"  ERROR: Invalid timestamp format: {response['timestamp']}")
            return False
        
        print(f"  ✓ Valid message format: {response['type']}")
    
    return True

if __name__ == "__main__":
    print("=== Chat GUI Test Suite ===\n")
    
    try:
        test_supervisor()
        if test_message_format():
            print("\n✅ All tests passed! The supervisor is working correctly.")
        else:
            print("\n❌ Some tests failed.")
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
    
    print("\n=== Test Complete ===")