#!/usr/bin/env python3
"""
Health and Wellness App Backend API Tests
Tests all backend endpoints for the health tracking application.
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, Any, Optional

# Backend URL from frontend .env
BASE_URL = "https://carecompanion-21.preview.emergentagent.com/api"

class HealthAppTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.token = None
        self.username = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success and response_data:
            print(f"   Response: {response_data}")
        print()
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        url = f"{self.base_url}{endpoint}"
        
        default_headers = {"Content-Type": "application/json"}
        if headers:
            default_headers.update(headers)
            
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=default_headers, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=default_headers, timeout=30)
            else:
                return False, f"Unsupported method: {method}", 0
                
            return True, response.json() if response.content else {}, response.status_code
            
        except requests.exceptions.RequestException as e:
            return False, f"Request failed: {str(e)}", 0
        except json.JSONDecodeError as e:
            return False, f"JSON decode error: {str(e)}", response.status_code if 'response' in locals() else 0
        except Exception as e:
            return False, f"Unexpected error: {str(e)}", 0
    
    def test_health_check(self):
        """Test basic health endpoint"""
        success, data, status_code = self.make_request("GET", "/health")
        
        if success and status_code == 200 and data.get("status") == "healthy":
            self.log_test("Health Check", True, f"Server is healthy, status: {status_code}")
        else:
            self.log_test("Health Check", False, f"Health check failed. Status: {status_code}", data)
    
    def test_user_registration(self):
        """Test user registration"""
        # Use realistic test data
        test_user = {
            "username": "sarah_wellness_2025",
            "password": "SecurePass123!",
            "email": "sarah@example.com"
        }
        
        success, data, status_code = self.make_request("POST", "/auth/register", test_user)
        
        if success and status_code == 200 and "token" in data and "username" in data:
            self.token = data["token"]
            self.username = data["username"]
            self.log_test("User Registration", True, f"User registered successfully. Username: {self.username}")
        else:
            self.log_test("User Registration", False, f"Registration failed. Status: {status_code}", data)
    
    def test_duplicate_registration(self):
        """Test duplicate user registration (should fail)"""
        if not self.username:
            self.log_test("Duplicate Registration", False, "Skipped - no username from previous test")
            return
            
        duplicate_user = {
            "username": self.username,
            "password": "AnotherPass123!",
            "email": "another@example.com"
        }
        
        success, data, status_code = self.make_request("POST", "/auth/register", duplicate_user)
        
        if success and status_code == 400:
            self.log_test("Duplicate Registration", True, "Correctly rejected duplicate username")
        else:
            self.log_test("Duplicate Registration", False, f"Should have rejected duplicate. Status: {status_code}", data)
    
    def test_user_login(self):
        """Test user login"""
        if not self.username:
            self.log_test("User Login", False, "Skipped - no username from registration")
            return
            
        login_data = {
            "username": self.username,
            "password": "SecurePass123!"
        }
        
        success, data, status_code = self.make_request("POST", "/auth/login", login_data)
        
        if success and status_code == 200 and "token" in data:
            self.token = data["token"]  # Update token
            self.log_test("User Login", True, f"Login successful for user: {self.username}")
        else:
            self.log_test("User Login", False, f"Login failed. Status: {status_code}", data)
    
    def test_invalid_login(self):
        """Test login with wrong password"""
        if not self.username:
            self.log_test("Invalid Login", False, "Skipped - no username from registration")
            return
            
        invalid_login = {
            "username": self.username,
            "password": "WrongPassword123!"
        }
        
        success, data, status_code = self.make_request("POST", "/auth/login", invalid_login)
        
        if success and status_code == 401:
            self.log_test("Invalid Login", True, "Correctly rejected invalid credentials")
        else:
            self.log_test("Invalid Login", False, f"Should have rejected invalid login. Status: {status_code}", data)
    
    def test_protected_endpoint_without_token(self):
        """Test accessing protected endpoint without token"""
        success, data, status_code = self.make_request("GET", "/health/profile")
        
        if success and status_code == 401:
            self.log_test("Protected Endpoint (No Token)", True, "Correctly rejected request without token")
        else:
            self.log_test("Protected Endpoint (No Token)", False, f"Should have rejected unauthorized request. Status: {status_code}", data)
    
    def test_create_health_profile(self):
        """Test creating health profile"""
        if not self.token:
            self.log_test("Create Health Profile", False, "Skipped - no authentication token")
            return
            
        profile_data = {
            "sleep_pattern": "night_owl",
            "sleep_hours": 6,
            "hydration_level": "moderate",
            "stress_level": "high",
            "exercise_frequency": "occasional",
            "diet_type": "balanced",
            "existing_conditions": "Mild anxiety",
            "lifestyle_notes": "Work from home, irregular schedule"
        }
        
        headers = {"Authorization": f"Bearer {self.token}"}
        success, data, status_code = self.make_request("POST", "/health/profile", profile_data, headers)
        
        if success and status_code == 200 and "health_persona" in data:
            self.log_test("Create Health Profile", True, f"Profile created with persona: {data.get('health_persona', 'N/A')}")
        else:
            self.log_test("Create Health Profile", False, f"Profile creation failed. Status: {status_code}", data)
    
    def test_get_health_profile(self):
        """Test retrieving health profile"""
        if not self.token:
            self.log_test("Get Health Profile", False, "Skipped - no authentication token")
            return
            
        headers = {"Authorization": f"Bearer {self.token}"}
        success, data, status_code = self.make_request("GET", "/health/profile", headers=headers)
        
        if success and status_code == 200 and data and "sleep_pattern" in data:
            self.log_test("Get Health Profile", True, f"Profile retrieved successfully. Sleep pattern: {data.get('sleep_pattern')}")
        else:
            self.log_test("Get Health Profile", False, f"Profile retrieval failed. Status: {status_code}", data)
    
    def test_create_symptom_entry(self):
        """Test creating symptom timeline entry"""
        if not self.token:
            self.log_test("Create Symptom Entry", False, "Skipped - no authentication token")
            return
            
        symptom_data = {
            "entry_type": "symptom",
            "title": "Headache",
            "description": "Mild headache after long work session",
            "severity": 3,
            "tags": ["work-related", "stress"]
        }
        
        headers = {"Authorization": f"Bearer {self.token}"}
        success, data, status_code = self.make_request("POST", "/timeline/entry", symptom_data, headers)
        
        if success and status_code == 200 and data.get("entry_type") == "symptom":
            self.log_test("Create Symptom Entry", True, f"Symptom entry created: {data.get('title')}")
        else:
            self.log_test("Create Symptom Entry", False, f"Symptom entry creation failed. Status: {status_code}", data)
    
    def test_create_mood_entry(self):
        """Test creating mood timeline entry"""
        if not self.token:
            self.log_test("Create Mood Entry", False, "Skipped - no authentication token")
            return
            
        mood_data = {
            "entry_type": "mood",
            "title": "Feeling stressed",
            "description": "High workload causing stress",
            "tags": ["work", "stress"]
        }
        
        headers = {"Authorization": f"Bearer {self.token}"}
        success, data, status_code = self.make_request("POST", "/timeline/entry", mood_data, headers)
        
        if success and status_code == 200 and data.get("entry_type") == "mood":
            self.log_test("Create Mood Entry", True, f"Mood entry created: {data.get('title')}")
        else:
            self.log_test("Create Mood Entry", False, f"Mood entry creation failed. Status: {status_code}", data)
    
    def test_get_timeline_entries(self):
        """Test retrieving timeline entries"""
        if not self.token:
            self.log_test("Get Timeline Entries", False, "Skipped - no authentication token")
            return
            
        headers = {"Authorization": f"Bearer {self.token}"}
        success, data, status_code = self.make_request("GET", "/timeline/entries", headers=headers)
        
        if success and status_code == 200 and isinstance(data, list):
            entry_count = len(data)
            self.log_test("Get Timeline Entries", True, f"Retrieved {entry_count} timeline entries")
            
            # Check if entries are in correct order (most recent first)
            if entry_count >= 2:
                timestamps = [entry.get("timestamp") for entry in data if "timestamp" in entry]
                if len(timestamps) >= 2:
                    # Check if sorted in descending order
                    is_sorted = all(timestamps[i] >= timestamps[i+1] for i in range(len(timestamps)-1))
                    if is_sorted:
                        self.log_test("Timeline Entry Order", True, "Entries are correctly ordered (newest first)")
                    else:
                        self.log_test("Timeline Entry Order", False, "Entries are not properly ordered")
        else:
            self.log_test("Get Timeline Entries", False, f"Timeline retrieval failed. Status: {status_code}", data)
    
    def test_chat_message(self):
        """Test sending chat message to AI"""
        if not self.token:
            self.log_test("Chat Message", False, "Skipped - no authentication token")
            return
            
        chat_data = {
            "message": "What can you tell me about my health profile? Any recommendations?"
        }
        
        headers = {"Authorization": f"Bearer {self.token}"}
        success, data, status_code = self.make_request("POST", "/chat/message", chat_data, headers)
        
        if success and status_code == 200 and data.get("role") == "assistant" and data.get("content"):
            response_length = len(data.get("content", ""))
            self.log_test("Chat Message", True, f"AI responded with {response_length} characters")
        else:
            self.log_test("Chat Message", False, f"Chat message failed. Status: {status_code}", data)
    
    def test_chat_history(self):
        """Test retrieving chat history"""
        if not self.token:
            self.log_test("Chat History", False, "Skipped - no authentication token")
            return
            
        headers = {"Authorization": f"Bearer {self.token}"}
        success, data, status_code = self.make_request("GET", "/chat/history", headers=headers)
        
        if success and status_code == 200 and "messages" in data:
            message_count = len(data["messages"])
            self.log_test("Chat History", True, f"Retrieved chat history with {message_count} messages")
        else:
            self.log_test("Chat History", False, f"Chat history retrieval failed. Status: {status_code}", data)
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print(f"🧪 Starting Health & Wellness App Backend Tests")
        print(f"🌐 Base URL: {self.base_url}")
        print("=" * 60)
        
        # Basic connectivity
        self.test_health_check()
        
        # Authentication flow
        self.test_user_registration()
        self.test_duplicate_registration()
        self.test_user_login()
        self.test_invalid_login()
        self.test_protected_endpoint_without_token()
        
        # Health profile
        self.test_create_health_profile()
        self.test_get_health_profile()
        
        # Timeline entries
        self.test_create_symptom_entry()
        self.test_create_mood_entry()
        self.test_get_timeline_entries()
        
        # AI Chat
        self.test_chat_message()
        self.test_chat_history()
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n🚨 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['details']}")
        
        print("\n" + "=" * 60)
        return passed_tests, failed_tests

if __name__ == "__main__":
    tester = HealthAppTester()
    tester.run_all_tests()