import { getServerClient, findAll, insert } from "@taskforge/database";

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

interface UserRoleRow {
  user_id: string;
  role: string;
}

interface UserPermissionRow {
  user_id: string;
  permission: string;
}

export class PermissionManager {
  private userPermissions: Map<string, Set<Permission>> = new Map();
  private roleCache: Map<string, Role> = new Map();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private db: any | null = null;
  private ready: Promise<void>;

  constructor(persist?: boolean) {
    if (persist) {
      try {
        this.db = getServerClient();
      } catch (err) {
        console.warn("[PermissionManager] Failed to get Supabase client, falling back to in-memory:", err);
        this.db = null;
      }
    }

    this.ready = this.db ? this.loadFromDb() : Promise.resolve();
  }

  private async loadFromDb(): Promise<void> {
    try {
      const roleRows = await findAll<UserRoleRow>(this.db, "user_roles");
      for (const row of roleRows) {
        const role = row.role as Role;
        this.roleCache.set(row.user_id, role);
        const perms = ROLE_PERMISSIONS[role];
        this.userPermissions.set(row.user_id, new Set(perms));
      }
      const permRows = await findAll<UserPermissionRow>(this.db, "user_permissions");
      for (const row of permRows) {
        if (!this.userPermissions.has(row.user_id)) {
          this.userPermissions.set(row.user_id, new Set());
        }
        this.userPermissions.get(row.user_id)!.add(row.permission as Permission);
      }
    } catch (err) {
      console.warn("[PermissionManager] Failed to load permissions from DB:", err);
    }
  }

  setRole(userId: string, role: Role): void {
    this.roleCache.set(userId, role);
    const perms = ROLE_PERMISSIONS[role];
    this.userPermissions.set(userId, new Set(perms));

    if (this.db) {
      this.ready.then(() => {
        import("@taskforge/database").then(({ upsert }) => {
          upsert(this.db, "user_roles", { user_id: userId, role }, "user_id").catch((err: Error) => {
            console.warn("[PermissionManager] Failed to persist role to DB:", err);
          });
        }).catch(() => {});
      }).catch(() => {});
    }
  }

  getRole(userId: string): Role | undefined {
    return this.roleCache.get(userId);
  }

  grant(userId: string, permission: Permission): void {
    if (!this.userPermissions.has(userId)) {
      this.userPermissions.set(userId, new Set());
    }
    this.userPermissions.get(userId)!.add(permission);

    if (this.db) {
      this.ready.then(() => {
        insert(this.db, "user_permissions", { user_id: userId, permission }).catch((err: Error) => {
          console.warn("[PermissionManager] Failed to persist permission to DB:", err);
        });
      }).catch(() => {});
    }
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

    if (this.db) {
      this.ready.then(() => {
        this.db.from("user_permissions").delete()
          .eq("user_id", userId)
          .eq("permission", permission)
          .then(() => {})
          .catch((err: Error) => {
            console.warn("[PermissionManager] Failed to revoke permission from DB:", err);
          });
      }).catch(() => {});
    }
  }

  listPermissions(userId: string): Permission[] {
    return Array.from(this.userPermissions.get(userId) || []);
  }

  clearUser(userId: string): void {
    this.userPermissions.delete(userId);
    this.roleCache.delete(userId);

    if (this.db) {
      this.ready.then(() => {
        this.db.from("user_permissions").delete().eq("user_id", userId)
          .then(() => {})
          .catch((err: Error) => {
            console.warn("[PermissionManager] Failed to clear user permissions from DB:", err);
          });
        this.db.from("user_roles").delete().eq("user_id", userId)
          .then(() => {})
          .catch((err: Error) => {
            console.warn("[PermissionManager] Failed to clear user role from DB:", err);
          });
      }).catch(() => {});
    }
  }
}
