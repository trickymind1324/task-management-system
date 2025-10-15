# FRD-03: Authentication & Authorization

**Feature:** User Authentication & Role-Based Access Control

**Version:** 1.0

**Last Updated:** October 6, 2025

**Status:** Draft

**Priority:** P1 (Important for Prototype - Mock Only)

---

## Overview

This document defines the authentication (who you are) and authorization (what you can do) system for Project Synapse. For the prototype phase, we'll implement a simplified mock authentication system. The production system will feature full OAuth 2.0, JWT tokens, and comprehensive RBAC.

## User Stories

- As a user, I want to log in securely so I can access my tasks
- As an admin, I want to manage user roles and permissions so I can control access
- As a manager, I want team members to only see departmental tasks so information is properly scoped
- As a system, I need to ensure users can only perform actions they're authorized for

## Authentication Flow

### Production Authentication Flow (Post-Prototype)

```
┌──────┐                  ┌──────────┐                  ┌─────────┐
│Client│                  │  Backend │                  │Auth Svc │
└───┬──┘                  └────┬─────┘                  └────┬────┘
    │                          │                             │
    │ 1. Login Request         │                             │
    │ (email + password)       │                             │
    │─────────────────────────>│                             │
    │                          │ 2. Validate Credentials     │
    │                          │────────────────────────────>│
    │                          │                             │
    │                          │ 3. Return User + Token      │
    │                          │<────────────────────────────│
    │ 4. Access Token +        │                             │
    │    Refresh Token         │                             │
    │<─────────────────────────│                             │
    │                          │                             │
    │ 5. API Request           │                             │
    │ (with Bearer token)      │                             │
    │─────────────────────────>│                             │
    │                          │ 6. Verify Token             │
    │                          │────────────────────────────>│
    │                          │ 7. Token Valid + Claims     │
    │                          │<────────────────────────────│
    │ 8. Response              │                             │
    │<─────────────────────────│                             │
```

### Prototype Authentication Flow (Mock)

```
┌──────┐                  ┌──────────────┐
│Client│                  │  Mock Auth   │
└───┬──┘                  └──────┬───────┘
    │                            │
    │ 1. Login (email only)      │
    │───────────────────────────>│
    │                            │
    │ 2. Match against mock data │
    │    (no password check)     │
    │                            │
    │ 3. Return mock user        │
    │<───────────────────────────│
    │                            │
    │ Store in localStorage      │
    │ or session                 │
```

## User Roles & Permissions

### Role Hierarchy

| Role | Level | Description |
|------|-------|-------------|
| **Viewer** | 1 | Read-only access to assigned tasks |
| **Member** | 2 | Can create and manage own tasks |
| **Manager** | 3 | Can manage team/department tasks |
| **Admin** | 4 | Full system access |

### Permission Matrix

| Action | Viewer | Member | Manager | Admin |
|--------|--------|--------|---------|-------|
| View own tasks | ✅ | ✅ | ✅ | ✅ |
| View team tasks | ❌ | ✅ | ✅ | ✅ |
| View all tasks | ❌ | ❌ | Dept only | ✅ |
| Create task | ❌ | ✅ | ✅ | ✅ |
| Edit own task | ❌ | ✅ | ✅ | ✅ |
| Edit team task | ❌ | ❌ | ✅ | ✅ |
| Delete own task | ❌ | ✅ | ✅ | ✅ |
| Delete team task | ❌ | ❌ | ✅ | ✅ |
| Assign tasks | ❌ | Self only | Team only | ✅ |
| Manage users | ❌ | ❌ | ❌ | ✅ |
| Manage departments | ❌ | ❌ | ❌ | ✅ |
| View analytics | ❌ | Own only | Dept only | ✅ |
| Export data | ❌ | Own only | Dept only | ✅ |

## Data Models

### User (Auth-Related Fields)

```typescript
interface User {
  user_id: string;
  email: string;
  username: string;
  password_hash: string;              // Production only, bcrypt/argon2
  role: UserRole;
  permissions: Permission[];
  is_active: boolean;
  email_verified: boolean;
  last_login: Date | null;
  mfa_enabled: boolean;               // Production only
  mfa_secret: string | null;          // Production only
}

type UserRole = 'Admin' | 'Manager' | 'Member' | 'Viewer';

type Permission =
  | 'tasks:read:own'
  | 'tasks:read:team'
  | 'tasks:read:all'
  | 'tasks:create'
  | 'tasks:update:own'
  | 'tasks:update:team'
  | 'tasks:update:all'
  | 'tasks:delete:own'
  | 'tasks:delete:team'
  | 'tasks:delete:all'
  | 'users:read'
  | 'users:create'
  | 'users:update'
  | 'users:delete'
  | 'departments:manage'
  | 'analytics:view:own'
  | 'analytics:view:department'
  | 'analytics:view:all';
```

### Session (Production)

```typescript
interface Session {
  session_id: string;                 // UUID
  user_id: string;
  access_token: string;               // JWT
  refresh_token: string;              // JWT (longer expiry)
  access_token_expires_at: Date;      // Typically 15 minutes
  refresh_token_expires_at: Date;     // Typically 7 days
  ip_address: string;
  user_agent: string;
  created_at: Date;
  last_activity: Date;
}
```

### JWT Token Claims (Production)

```typescript
interface JWTClaims {
  sub: string;                        // Subject (user_id)
  email: string;
  role: UserRole;
  permissions: Permission[];
  iat: number;                        // Issued at (timestamp)
  exp: number;                        // Expiration (timestamp)
  iss: string;                        // Issuer (e.g., "project-synapse")
}
```

## API Endpoints (Production)

### POST /api/auth/register

**Request:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecureP@ss123",
  "full_name": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "email_verified": false
  },
  "message": "Registration successful. Please verify your email."
}
```

### POST /api/auth/login

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "user_id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "full_name": "John Doe",
      "role": "Member",
      "permissions": ["tasks:read:own", "tasks:create", ...]
    },
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 900
  }
}
```

### POST /api/auth/refresh

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 900
  }
}
```

### POST /api/auth/logout

**Request Header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### GET /api/auth/me

**Request Header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "full_name": "John Doe",
    "role": "Member",
    "permissions": ["tasks:read:own", "tasks:create", ...],
    "department": "dept-001"
  }
}
```

## Prototype Implementation

### Mock Authentication Service

```typescript
// lib/auth/mock-auth.ts

interface MockUser {
  user_id: string;
  email: string;
  username: string;
  full_name: string;
  role: UserRole;
  department: string | null;
}

const MOCK_USERS: MockUser[] = [
  {
    user_id: 'user-001',
    email: 'Bharath@example.com',
    username: 'Bharath_pm',
    full_name: 'Bharath',
    role: 'Manager',
    department: 'dept-001'
  },
  {
    user_id: 'user-002',
    email: 'Sunny@example.com',
    username: 'Sunny_dev',
    full_name: 'Sunny',
    role: 'Member',
    department: 'dept-002'
  },
  {
    user_id: 'user-003',
    email: 'Raghu@example.com',
    username: 'Raghu_exec',
    full_name: 'Raghu',
    role: 'Admin',
    department: null
  }
];

export async function mockLogin(email: string): Promise<MockUser | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const user = MOCK_USERS.find(u => u.email === email);
  if (user) {
    // Store in localStorage for persistence
    localStorage.setItem('currentUser', JSON.stringify(user));
    return user;
  }
  return null;
}

export function mockLogout(): void {
  localStorage.removeItem('currentUser');
}

export function getCurrentUser(): MockUser | null {
  const userStr = localStorage.getItem('currentUser');
  return userStr ? JSON.parse(userStr) : null;
}

export function hasPermission(permission: Permission): boolean {
  const user = getCurrentUser();
  if (!user) return false;

  // Simple role-based check for prototype
  const rolePermissions: Record<UserRole, Permission[]> = {
    'Admin': ['tasks:read:all', 'tasks:update:all', 'tasks:delete:all', 'users:manage'],
    'Manager': ['tasks:read:team', 'tasks:update:team', 'tasks:delete:team'],
    'Member': ['tasks:read:own', 'tasks:create', 'tasks:update:own', 'tasks:delete:own'],
    'Viewer': ['tasks:read:own']
  };

  return rolePermissions[user.role]?.includes(permission) ?? false;
}
```

### Login Page Component

```typescript
// app/login/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { mockLogin } from '@/lib/auth/mock-auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const user = await mockLogin(email);
    if (user) {
      router.push('/dashboard');
    } else {
      setError('User not found. Try: Bharath@example.com, Sunny@example.com, or Raghu@example.com');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center">Project Synapse</h2>
          <p className="mt-2 text-center text-gray-600">Mock Login (Prototype)</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Bharath@example.com"
            />
          </div>
          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        <div className="text-xs text-gray-500 text-center">
          <p>Mock users:</p>
          <p>• Bharath@example.com (Manager)</p>
          <p>• Sunny@example.com (Member)</p>
          <p>• Raghu@example.com (Admin)</p>
        </div>
      </div>
    </div>
  );
}
```

### Protected Route Middleware

```typescript
// middleware.ts (Next.js)

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // For prototype, just check if user exists in cookie/localStorage
  // In production, verify JWT token here

  const isLoginPage = request.nextUrl.pathname === '/login';
  const isPublicPage = request.nextUrl.pathname === '/' || isLoginPage;

  // For prototype: skip middleware, handle in client components
  // Production would verify token server-side here

  if (!isPublicPage) {
    // Redirect to login if not authenticated (handled client-side in prototype)
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

## Security Considerations

### Production Requirements (Post-Prototype)

1. **Password Security**
   - Minimum 8 characters
   - Require: 1 uppercase, 1 lowercase, 1 number, 1 special character
   - Hash with bcrypt (cost factor 12) or Argon2
   - Never log or expose passwords

2. **Token Security**
   - JWT signed with RS256 (asymmetric)
   - Short-lived access tokens (15 minutes)
   - Longer refresh tokens (7 days)
   - Store tokens in httpOnly cookies (not localStorage)
   - Implement token rotation

3. **Session Management**
   - Max 5 concurrent sessions per user
   - Auto-logout after 30 minutes of inactivity
   - Device tracking and notification for new logins

4. **Multi-Factor Authentication (MFA)**
   - TOTP (Time-based One-Time Password) via authenticator apps
   - Backup codes for account recovery
   - Required for Admin and Manager roles

5. **Rate Limiting**
   - Login attempts: 5 per 15 minutes per IP
   - API requests: 100 per minute per user
   - Implement exponential backoff for failed attempts

6. **HTTPS Only**
   - All communication over TLS 1.3
   - HSTS headers enabled
   - Secure and SameSite cookie flags

### Prototype Security (Relaxed)

- No password validation
- No encryption
- Client-side authentication only
- LocalStorage for session (acceptable for prototype)
- No rate limiting
- No MFA

## Prototype Scope

### Include (Prototype)

- Mock login page (email only, no password)
- 3-5 predefined mock users
- LocalStorage-based session
- Basic role display in UI
- Simple "currentUser" context
- Mock logout functionality

### Exclude (Prototype)

- Real password hashing
- JWT token generation/validation
- OAuth 2.0 integration
- MFA
- Session management
- Rate limiting
- Password reset flow
- Email verification
- Role/permission management UI
- Audit logging

## Acceptance Criteria

- [ ] Login page accepts email and "logs in" mock users
- [ ] Current user information stored and accessible throughout app
- [ ] Logout functionality clears session
- [ ] Different users show different role badges in UI
- [ ] Protected routes redirect to login if not authenticated
- [ ] User avatar and name displayed in header
- [ ] Quick user switcher for testing (developer tool)

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-06 | Sunny | Initial draft with mock and production specs |

## Related Documents

- [00 - INDEX](./00-INDEX.md)
- [01 - Core Data Models](./01-core-data-models.md)
- [02 - Task Management UI](./02-task-management-ui.md)
- [09 - API Specification](./09-api-specification.md)
