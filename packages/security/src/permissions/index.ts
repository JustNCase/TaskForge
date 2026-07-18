export type Permission =
  | "read"
  | "write"
  | "admin"
  | "voice"
  | "analytics"
  | "vision"
  | "integration"
  | "users.read"
  | "users.write"
  | "users.admin"
  | "settings.read"
  | "settings.write"
  | "audit.read"
  | "api.keys"
  | "security.admin";

export type Role = "admin" | "user" | "viewer" | "developer";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: ["admin", "read", "write", "voice", "analytics", "vision", "integration",
    "users.read", "users.write", "users.admin", "settings.read", "settings.write",
    "audit.read", "api.keys", "security.admin"],
  developer: ["read", "write", "voice", "analytics", "vision", "integration",
    "users.read", "settings.read", "api.keys"],
  user: ["read", "write", "voice", "analytics"],
  viewer: ["read", "analytics"],
};

export class PermissionManager {
  private userPermissions: Map<string, Set<Permission>> = new Map();
  private roleCache: Map<string, Role> = new Map();

  setRole(userId: string, role: Role): void {
    this.roleCache.set(userId, role);
    const perms = ROLE_PERMISSIONS[role];
    this.userPermissions.set(userId, new Set(perms));
  }

  getRole(userId: string): Role | undefined {
    return this.roleCache.get(userId);
  }

  grant(userId: string, permission: Permission): void {
    if (!this.userPermissions.has(userId)) {
      this.userPermissions.set(userId, new Set());
    }
    this.userPermissions.get(userId)!.add(permission);
  }

  has(userId: string, permission: Permission): boolean {
    return this.userPermissions.get(userId)?.has(permission) ?? false;
  }

  hasAny(userId: string, permissions: Permission[]): boolean {
    const userPerms = this.userPermissions.get(userId);
    if (!userPerms) return false;
    return permissions.some((p) => userPerms.has(p));
  }

  hasAll(userId: string, permissions: Permission[]): boolean {
    const userPerms = this.userPermissions.get(userId);
    if (!userPerms) return false;
    return permissions.every((p) => userPerms.has(p));
  }

  revoke(userId: string, permission: Permission): void {
    this.userPermissions.get(userId)?.delete(permission);
  }

  listPermissions(userId: string): Permission[] {
    return Array.from(this.userPermissions.get(userId) || []);
  }

  clearUser(userId: string): void {
    this.userPermissions.delete(userId);
    this.roleCache.delete(userId);
  }
}
