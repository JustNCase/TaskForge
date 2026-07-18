export type Permission = "read" | "write" | "admin" | "voice" | "analytics" | "vision" | "integration" | "users.read" | "users.write" | "users.admin" | "settings.read" | "settings.write" | "audit.read" | "api.keys" | "security.admin";
export type Role = "admin" | "user" | "viewer" | "developer";
export declare class PermissionManager {
    private userPermissions;
    private roleCache;
    setRole(userId: string, role: Role): void;
    getRole(userId: string): Role | undefined;
    grant(userId: string, permission: Permission): void;
    has(userId: string, permission: Permission): boolean;
    hasAny(userId: string, permissions: Permission[]): boolean;
    hasAll(userId: string, permissions: Permission[]): boolean;
    revoke(userId: string, permission: Permission): void;
    listPermissions(userId: string): Permission[];
    clearUser(userId: string): void;
}
//# sourceMappingURL=index.d.ts.map