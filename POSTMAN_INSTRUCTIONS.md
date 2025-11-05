# Chatterbox API Postman Collection

This document provides instructions on how to use the Postman collection for testing the Chatterbox backend APIs.

## Setup Instructions

1. **Import the Collection**:
   - Open Postman
   - Click on "Import" button
   - Select the `Chatterbox_API.postman_collection.json` file
   - The collection will be imported with all API endpoints

2. **Environment Setup**:
   - Create a new environment in Postman
   - Add a variable named `auth_token` (this will be populated after login)

## API Testing Workflow

### 1. Authentication
1. **Register a User**:
   - Go to "Authentication" → "Register User"
   - Modify the request body with your desired user details
   - Send the request

2. **Login**:
   - Go to "Authentication" → "Login User"
   - Use the registered user credentials
   - Send the request
   - Copy the JWT token from the response

3. **Set Auth Token**:
   - In the top right corner of Postman, select your environment
   - Set the `auth_token` variable to the JWT token you copied

### 2. User Management
- All endpoints under "User Management" require authentication
- The token will be automatically included in requests

### 3. Friends System
- All endpoints under "Friends" require authentication
- Use actual user IDs when sending requests

### 4. Chat Messages
- All endpoints under "Chat Messages" require authentication
- Use actual user IDs when sending requests

### 5. Notifications
- All endpoints under "Notifications" require authentication

### 6. WebSocket Testing
- The WebSocket endpoints are included for reference
- For actual WebSocket testing, you'll need to use a WebSocket client or the application's frontend

## WebSocket Testing

For testing WebSocket functionality:

1. **WebSocket Connection**:
   - Use a WebSocket client (like wscat or a browser-based tool)
   - Connect to `ws://localhost:8083/api/ws`
   - Include the Authorization header with your JWT token

2. **STOMP Messaging**:
   - After connecting via WebSocket, establish a STOMP connection
   - Subscribe to:
     - `/topic/messages` for public messages
     - `/user/queue/messages` for private messages
   - Send messages to:
     - `/app/chat` for public messages
     - `/app/private` for private messages

## Notes

- All API endpoints are prefixed with `http://localhost:8083/api/`
- Make sure the backend server is running on port 8083
- The WebSocket endpoint is available at `ws://localhost:8083/api/ws`
- Authentication is required for most endpoints using JWT Bearer tokens

## Common Request Bodies

### Register User
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "gender": "MALE",
  "dob": "1990-01-01",
  "role": "USER",
  "mobile": "1234567890"
}
```

### Login User
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Send Friend Request
```json
{
  "friendId": 2
}
```

### Send Chat Message
```json
{
  "receiverId": 2,
  "content": "Hello, how are you?"
}
```