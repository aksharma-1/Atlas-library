/**
 * Auth API contracts shared between backend and frontend.
 * These types define the shape of request bodies and response payloads
 * for all authentication endpoints.
 */
/** Body sent to POST /api/v1/auth/login */
export interface LoginRequest {
    email: string;
    password: string;
}
/**
 * The authenticated user payload embedded in the JWT and
 * returned by GET /api/v1/auth/me and POST /api/v1/auth/login.
 *
 * NEVER includes passwordHash or any sensitive credential.
 */
export interface AuthUser {
    userId: string;
    tenantId: string;
    name: string;
    email: string;
    role: 'owner' | 'staff';
    tenantName: string;
}
/** Response body from POST /api/v1/auth/login */
export interface LoginResponse {
    user: AuthUser;
}
/** Response body from GET /api/v1/auth/me */
export interface MeResponse {
    user: AuthUser;
}
//# sourceMappingURL=auth.d.ts.map