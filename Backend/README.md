# Backend API Documentation

This document provides details about the available endpoints in the backend application.

## Endpoints

### 1. **Register User**

- **URL**: `/users/register`
- **Description**: Registers a new user in the system.
- **HTTP Method**: `POST`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "user": {
      "_id": "64f1c2e5b5d6f2a1c8e9b123",
      "email": "user@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

---

### 2. **Login User**

- **URL**: `/users/login`
- **Description**: Authenticates a user and returns a JWT token.
- **HTTP Method**: `POST`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "user": {
      "_id": "64f1c2e5b5d6f2a1c8e9b123",
      "email": "user@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

---

### 3. **Get User Profile**

- **URL**: `/users/profile`
- **Description**: Retrieves the profile of the authenticated user.
- **HTTP Method**: `GET`
- **Headers**:
  ```
  Authorization: Bearer <JWT_TOKEN>
  ```
- **Response**:
  ```json
  {
    "user": {
      "email": "user@example.com"
    }
  }
  ```

---

### 4. **Logout User**

- **URL**: `/users/logout`
- **Description**: Logs out the authenticated user by blacklisting the JWT token.
- **HTTP Method**: `GET`
- **Headers**:
  ```
  Authorization: Bearer <JWT_TOKEN>
  ```
- **Response**:
  ```json
  {
    "message": "Successfully logged out"
  }
  ```

---

### 5. **Create Project**

- **URL**: `/projects/create`
- **Description**: Creates a new project for the authenticated user.
- **HTTP Method**: `POST`
- **Headers**:
  ```
  Authorization: Bearer <JWT_TOKEN>
  ```
- **Request Body**:
  ```json
  {
    "name": "My Project"
  }
  ```
- **Response**:
  ```json
  {
    "_id": "64f1c2e5b5d6f2a1c8e9b456",
    "name": "my project",
    "users": ["64f1c2e5b5d6f2a1c8e9b123"],
    "__v": 0
  }
  ```

---

### Notes

- For all `POST` requests, include the following header:
  ```
  Content-Type: application/json
  ```
- For protected routes (`/users/profile`, `/users/logout`, and `/projects/create`), include the following header:
  ```
  Authorization: Bearer <JWT_TOKEN>
  ```
