const ROLE_PERMISSIONS = {
    admin: ["admin", "read", "write", "voice", "analytics", "vision", "integration",
        "users.read", "users.write", "users.admin", "settings.read", "settings.write",
        "audit.read", "api.keys", "security.admin"],
    developer: ["read", "write", "voice", "analytics", "vision", "integration",
        "users.read", "settings.read", "api.keys"],
    user: ["read", "write", "voice", "analytics"],
    viewer: ["read", "analytics"],
};
export class PermissionManager {
    userPermissions = new Map();
    roleCache = new Map();
    setRole(userId, role) {
        this.roleCache.set(userId, role);
        const perms = ROLE_PERMISSIONS[role];
        this.userPermissions.set(userId, new Set(perms));
    }
    getRole(userId) {
        return this.roleCache.get(userId);
    }
    grant(userId, permission) {
        if (!this.userPermissions.has(userId)) {
            this.userPermissions.set(userId, new Set());
        }
        this.userPermissions.get(userId).add(permission);
    }
    has(userId, permission) {
        return this.userPermissions.get(userId)?.has(permission) ?? false;
    }
    hasAny(userId, permissions) {
        const userPerms = this.userPermissions.get(userId);
        if (!userPerms)
            return false;
        return permissions.some((p) => userPerms.has(p));
    }
    hasAll(userId, permissions) {
        const userPerms = this.userPermissions.get(userId);
        if (!userPerms)
            return false;
        return permissions.every((p) => userPerms.has(p));
    }
    revoke(userId, permission) {
        this.userPermissions.get(userId)?.delete(permission);
    }
    listPermissions(userId) {
        return Array.from(this.userPermissions.get(userId) || []);
    }
    clearUser(userId) {
        this.userPermissions.delete(userId);
        this.roleCache.delete(userId);
    }
}
//# sourceMappingURL=index.js.map