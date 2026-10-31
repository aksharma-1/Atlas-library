/**
 * Response shape for GET /api/v1/health.
 * Used by both backend (sends) and frontend (receives).
 */
export interface HealthResponse {
    /** Always "ok" when the server is healthy. */
    status: 'ok';
    /** ISO 8601 timestamp of when the response was generated. */
    timestamp: string;
    /** Current NODE_ENV value. */
    environment: string;
    /** Package version from package.json. */
    version: string;
}
//# sourceMappingURL=health.d.ts.map