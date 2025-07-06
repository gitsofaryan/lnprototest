#!/usr/bin/env python3
"""
Test script for the minimal API implementation.
Tests both /connect and /rawmsg endpoints.
"""

import requests
import json
import time

API_BASE = "http://localhost:5000"

def test_connect_endpoint():
    """Test the /connect endpoint"""
    print("Testing /connect endpoint...")
    
    payload = {
        "node_id": "03"
    }
    
    try:
        response = requests.post(f"{API_BASE}/connect", json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ /connect endpoint working correctly")
            return True
        else:
            print("❌ /connect endpoint failed")
            return False
            
    except Exception as e:
        print(f"❌ Error testing /connect: {str(e)}")
        return False

def test_rawmsg_endpoint():
    """Test the /rawmsg endpoint"""
    print("\nTesting /rawmsg endpoint...")
    
    payload = {
        "type": "ping",
        "content": {
            "num_pong_bytes": 16,
            "byteslen": 16
        }
    }
    
    try:
        response = requests.post(f"{API_BASE}/rawmsg", json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ /rawmsg endpoint working correctly")
            return True
        else:
            print("❌ /rawmsg endpoint failed")
            return False
            
    except Exception as e:
        print(f"❌ Error testing /rawmsg: {str(e)}")
        return False

def test_invalid_endpoints():
    """Test that other endpoints are removed"""
    print("\nTesting that unnecessary endpoints are removed...")
    
    endpoints_to_test = [
        "/api/connect",  # Should be /connect now
        "/api/raw-msg",  # Should be /rawmsg now
        "/health",       # Should be removed
        "/api/node-info" # Should be removed
    ]
    
    for endpoint in endpoints_to_test:
        try:
            response = requests.get(f"{API_BASE}{endpoint}")
            if response.status_code == 404:
                print(f"✅ {endpoint} correctly removed")
            else:
                print(f"❌ {endpoint} still exists (status: {response.status_code})")
        except Exception as e:
            print(f"❌ Error testing {endpoint}: {str(e)}")

if __name__ == "__main__":
    print("=== Testing Minimal API ===")
    print("Make sure the API server is running on localhost:5000")
    print("Run: python app.py")
    print()
    
    # Wait a bit for user to start server
    input("Press Enter when the server is running...")
    
    # Run tests
    connect_ok = test_connect_endpoint()
    rawmsg_ok = test_rawmsg_endpoint()
    test_invalid_endpoints()
    
    print("\n=== Test Summary ===")
    if connect_ok and rawmsg_ok:
        print("✅ All core endpoints working correctly!")
        print("✅ API refactoring successful!")
    else:
        print("❌ Some tests failed. Check the implementation.")
