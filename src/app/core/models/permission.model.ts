export enum PermissionAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  EXPORT = 'EXPORT',
  MANAGE_ROLES = 'MANAGE_ROLES',
  READ_OWN = 'READ_OWN',
  BROADCAST = 'BROADCAST',
}

export interface Permission {
  id: string;
  resource: string;
  action: PermissionAction;
  name: string;
  displayName: string;
  description?: string;
  createdAt: Date;
}

export interface PermissionFilters {
  resource?: string;
  action?: PermissionAction;
}

export interface GroupedPermissions {
  [resource: string]: Permission[];
}
