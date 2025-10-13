#!/usr/bin/env python3
"""
Ghost Hunting API Backend Test Suite
Tests all backend endpoints for the Ghost Hunting application
"""

import requests
import json
import base64
import os
from datetime import datetime

# Get backend URL from frontend .env
BACKEND_URL = "https://ghost-tracker-1.preview.emergentagent.com/api"

class GhostHuntingAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session_ids = []
        self.recording_ids = []
        
    def test_health_check(self):
        """Test GET / - Health check (via API endpoint verification)"""
        print("🔍 Testing backend health via API endpoints...")
        try:
            # Since root / serves frontend, test backend health via sessions endpoint
            response = requests.get(f"{self.base_url}/sessions")
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.json()}")
            
            if response.status_code == 200:
                data = response.json()
                if "success" in data and "sessions" in data:
                    print("✅ Backend health check passed (API is responsive)")
                    return True
                else:
                    print("❌ Backend health check failed - invalid response format")
                    return False
            else:
                print(f"❌ Backend health check failed - status code {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Backend health check failed - {str(e)}")
            return False
    
    def test_create_session(self, session_data):
        """Test POST /api/sessions - Create investigation session"""
        print(f"🔍 Testing create session with data: {session_data}")
        try:
            response = requests.post(f"{self.base_url}/sessions", json=session_data)
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.json()}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "session" in data:
                    session_id = data["session"].get("id")
                    if session_id:
                        self.session_ids.append(session_id)
                        print(f"✅ Session created successfully with ID: {session_id}")
                        return session_id
                    else:
                        print("❌ Session creation failed - no ID returned")
                        return None
                else:
                    print("❌ Session creation failed - invalid response format")
                    return None
            else:
                print(f"❌ Session creation failed - status code {response.status_code}")
                return None
        except Exception as e:
            print(f"❌ Session creation failed - {str(e)}")
            return None
    
    def test_get_sessions(self):
        """Test GET /api/sessions - List all sessions"""
        print("🔍 Testing get all sessions...")
        try:
            response = requests.get(f"{self.base_url}/sessions")
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.json()}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "sessions" in data:
                    sessions = data["sessions"]
                    print(f"✅ Retrieved {len(sessions)} sessions")
                    return sessions
                else:
                    print("❌ Get sessions failed - invalid response format")
                    return None
            else:
                print(f"❌ Get sessions failed - status code {response.status_code}")
                return None
        except Exception as e:
            print(f"❌ Get sessions failed - {str(e)}")
            return None
    
    def test_get_session(self, session_id):
        """Test GET /api/sessions/{session_id} - Get specific session"""
        print(f"🔍 Testing get session with ID: {session_id}")
        try:
            response = requests.get(f"{self.base_url}/sessions/{session_id}")
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.json()}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "session" in data:
                    print("✅ Session retrieved successfully")
                    return data["session"]
                else:
                    print("❌ Get session failed - invalid response format")
                    return None
            else:
                print(f"❌ Get session failed - status code {response.status_code}")
                return None
        except Exception as e:
            print(f"❌ Get session failed - {str(e)}")
            return None
    
    def test_delete_session(self, session_id):
        """Test DELETE /api/sessions/{session_id} - Delete session"""
        print(f"🔍 Testing delete session with ID: {session_id}")
        try:
            response = requests.delete(f"{self.base_url}/sessions/{session_id}")
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.json()}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    print("✅ Session deleted successfully")
                    if session_id in self.session_ids:
                        self.session_ids.remove(session_id)
                    return True
                else:
                    print("❌ Delete session failed - invalid response format")
                    return False
            else:
                print(f"❌ Delete session failed - status code {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Delete session failed - {str(e)}")
            return False
    
    def test_create_recording(self, recording_data):
        """Test POST /api/recordings - Create recording"""
        print(f"🔍 Testing create recording with data: {recording_data}")
        try:
            response = requests.post(f"{self.base_url}/recordings", json=recording_data)
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.json()}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "recording" in data:
                    recording_id = data["recording"].get("id")
                    if recording_id:
                        self.recording_ids.append(recording_id)
                        print(f"✅ Recording created successfully with ID: {recording_id}")
                        return recording_id
                    else:
                        print("❌ Recording creation failed - no ID returned")
                        return None
                else:
                    print("❌ Recording creation failed - invalid response format")
                    return None
            else:
                print(f"❌ Recording creation failed - status code {response.status_code}")
                return None
        except Exception as e:
            print(f"❌ Recording creation failed - {str(e)}")
            return None
    
    def test_get_recordings(self, session_id):
        """Test GET /api/recordings/{session_id} - Get recordings for a session"""
        print(f"🔍 Testing get recordings for session ID: {session_id}")
        try:
            response = requests.get(f"{self.base_url}/recordings/{session_id}")
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.json()}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "recordings" in data:
                    recordings = data["recordings"]
                    print(f"✅ Retrieved {len(recordings)} recordings for session")
                    return recordings
                else:
                    print("❌ Get recordings failed - invalid response format")
                    return None
            else:
                print(f"❌ Get recordings failed - status code {response.status_code}")
                return None
        except Exception as e:
            print(f"❌ Get recordings failed - {str(e)}")
            return None
    
    def test_transcribe_endpoint(self):
        """Test POST /api/transcribe - Verify endpoint exists and handles errors properly"""
        print("🔍 Testing transcribe endpoint (error handling only)...")
        try:
            # Test without file - should return error
            response = requests.post(f"{self.base_url}/transcribe")
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.json()}")
            
            if response.status_code == 422:  # FastAPI validation error for missing file
                print("✅ Transcribe endpoint exists and properly validates input")
                return True
            else:
                print(f"❌ Transcribe endpoint validation failed - unexpected status code {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Transcribe endpoint test failed - {str(e)}")
            return False
    
    def test_analyze_evp_endpoint(self):
        """Test POST /api/analyze-evp - Verify endpoint exists and handles errors properly"""
        print("🔍 Testing analyze-evp endpoint (error handling only)...")
        try:
            # Test without required data - should return error
            response = requests.post(f"{self.base_url}/analyze-evp")
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.json()}")
            
            if response.status_code == 422:  # FastAPI validation error for missing parameters
                print("✅ Analyze-EVP endpoint exists and properly validates input")
                return True
            else:
                print(f"❌ Analyze-EVP endpoint validation failed - unexpected status code {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Analyze-EVP endpoint test failed - {str(e)}")
            return False
    
    def run_full_test_suite(self):
        """Run the complete test suite as specified in the review request"""
        print("🚀 Starting Ghost Hunting API Test Suite")
        print("=" * 60)
        
        results = {
            "health_check": False,
            "create_session_1": False,
            "get_session": False,
            "create_session_2": False,
            "list_sessions": False,
            "create_recording": False,
            "get_recordings": False,
            "delete_session": False,
            "verify_deletion": False,
            "final_session_count": False,
            "transcribe_endpoint": False,
            "analyze_evp_endpoint": False
        }
        
        # 1. Test health check endpoint
        results["health_check"] = self.test_health_check()
        print()
        
        # 2. Create a test session
        session_1_data = {
            "name": "Haunted Manor Investigation",
            "location": "Old Victorian House, 123 Elm Street",
            "date": datetime.now().isoformat(),
            "notes": "Initial investigation of reported paranormal activity"
        }
        session_1_id = self.test_create_session(session_1_data)
        results["create_session_1"] = session_1_id is not None
        print()
        
        if session_1_id:
            # 3. Verify session was created by getting it
            session = self.test_get_session(session_1_id)
            results["get_session"] = session is not None
            print()
            
            # 4. Create another session
            session_2_data = {
                "name": "Cemetery EVP Session",
                "location": "Riverside Cemetery, Plot 42",
                "date": datetime.now().isoformat(),
                "notes": "Follow-up investigation focusing on EVP recordings"
            }
            session_2_id = self.test_create_session(session_2_data)
            results["create_session_2"] = session_2_id is not None
            print()
            
            # 5. List all sessions (should have 2)
            sessions = self.test_get_sessions()
            results["list_sessions"] = sessions is not None and len(sessions) >= 2
            print()
            
            # 6. Create a mock recording for the session
            recording_data = {
                "session_id": session_1_id,
                "audio_base64": base64.b64encode(b"mock_audio_data").decode(),
                "type": "evp",
                "timestamp": datetime.now().isoformat(),
                "transcription": ""
            }
            recording_id = self.test_create_recording(recording_data)
            results["create_recording"] = recording_id is not None
            print()
            
            # 7. Get recordings for the session
            recordings = self.test_get_recordings(session_1_id)
            results["get_recordings"] = recordings is not None and len(recordings) > 0
            print()
            
            # 8. Delete one session
            if session_2_id:
                delete_success = self.test_delete_session(session_2_id)
                results["delete_session"] = delete_success
                print()
                
                # 9. Verify deletion by trying to get the deleted session
                deleted_session = self.test_get_session(session_2_id)
                results["verify_deletion"] = deleted_session is None
                print()
                
                # 10. List sessions again (should have 1)
                final_sessions = self.test_get_sessions()
                results["final_session_count"] = final_sessions is not None and len(final_sessions) == len(sessions) - 1
                print()
        
        # 11. Test transcribe endpoint (error handling only)
        results["transcribe_endpoint"] = self.test_transcribe_endpoint()
        print()
        
        # 12. Test analyze-evp endpoint (error handling only)
        results["analyze_evp_endpoint"] = self.test_analyze_evp_endpoint()
        print()
        
        # Summary
        print("=" * 60)
        print("🏁 TEST RESULTS SUMMARY")
        print("=" * 60)
        
        passed = 0
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{test_name}: {status}")
            if result:
                passed += 1
        
        print(f"\nOverall: {passed}/{total} tests passed ({(passed/total)*100:.1f}%)")
        
        if passed == total:
            print("🎉 All tests passed! Ghost Hunting API is working correctly.")
        else:
            print("⚠️  Some tests failed. Please check the detailed output above.")
        
        return results

def main():
    """Main test execution"""
    tester = GhostHuntingAPITester()
    results = tester.run_full_test_suite()
    return results

if __name__ == "__main__":
    main()