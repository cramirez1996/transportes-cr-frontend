# Super Admin Frontend Implementation - Sistema de Roles

## Resumen

Este documento describe los cambios en el frontend para permitir que los usuarios con rol **super_admin** puedan editar roles del sistema, que normalmente están protegidos en modo solo lectura.

## Cambios Realizados

### 1. AuthService - Método `isSuperAdmin()`

**Archivo:** `frontend/src/app/core/services/auth.service.ts`

Se agregó un método utilitario para verificar si el usuario actual es super_admin:

```typescript
/**
 * Verificar si el usuario es super admin
 */
isSuperAdmin(): boolean {
  return this.hasRole('super_admin');
}
```

**Uso:**
```typescript
import { AuthService } from '../../../../core/services/auth.service';

private authService = inject(AuthService);

if (this.authService.isSuperAdmin()) {
  // Usuario es super_admin
}
```

---

### 2. Role List Component - Edición Condicional

**Archivo:** `frontend/src/app/features/admin/roles/role-list/role-list.component.ts`

Se agregó el método `canEdit()` que determina si un rol puede ser editado:

```typescript
/**
 * Check if a role can be edited
 * Custom roles can always be edited
 * System roles can only be edited by super_admin
 */
canEdit(role: Role): boolean {
  if (!role.isSystem) {
    return true; // Custom roles can always be edited
  }
  return this.authService.isSuperAdmin(); // System roles only by super_admin
}
```

**Template HTML actualizado:**

```html
<!-- Edit button (custom roles or super_admin can edit system roles) -->
@if (canEdit(role)) {
  <a
    [routerLink]="['/admin/roles', role.id, 'edit']"
    class="inline-flex items-center px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors"
    [title]="role.isSystem ? 'Editar rol del sistema (Super Admin)' : 'Editar'"
  >
    <svg>...</svg>
  </a>
}

<!-- Delete button (only custom roles can be deleted) -->
@if (!role.isSystem) {
  <button (click)="deleteRole(role)">...</button>
}

<!-- Read-only indicator (only for non-super_admin users viewing system roles) -->
@if (role.isSystem && !canEdit(role)) {
  <span class="inline-flex items-center px-3 py-1.5 text-xs text-gray-400 border border-gray-200 rounded-lg cursor-not-allowed">
    Solo lectura
  </span>
}
```

**Resultado:**
- ✅ Super_admin puede ver botón "Editar" en roles del sistema
- ✅ Usuarios normales ven "Solo lectura" en roles del sistema
- ✅ Todos los usuarios pueden editar roles personalizados
- ❌ Nadie puede eliminar roles del sistema (ni siquiera super_admin)

---

### 3. Role Detail Component - Botón de Edición Condicional

**Archivo:** `frontend/src/app/features/admin/roles/role-detail/role-detail.component.ts`

Se agregó el método `canEdit()` y se actualizó `navigateToEdit()`:

```typescript
navigateToEdit(): void {
  if (this.role() && this.canEdit()) {
    this.router.navigate(['/admin/roles', this.role()!.id, 'edit']);
  }
}

/**
 * Check if the current role can be edited
 * Custom roles can always be edited
 * System roles can only be edited by super_admin
 */
canEdit(): boolean {
  const role = this.role();
  if (!role) return false;
  if (!role.isSystem) return true; // Custom roles can always be edited
  return this.authService.isSuperAdmin(); // System roles only by super_admin
}
```

**Template HTML actualizado:**

```html
<div class="flex gap-3">
  @if (canEdit()) {
    <button
      (click)="navigateToEdit()"
      class="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
      [title]="role()!.isSystem ? 'Editar rol del sistema (Super Admin)' : 'Editar rol'"
    >
      <svg>...</svg>
      Editar
    </button>
  } @else if (role()!.isSystem) {
    <span class="px-4 py-2 text-gray-500 bg-gray-100 rounded-lg flex items-center gap-2 cursor-not-allowed">
      <svg>...</svg>
      Solo lectura
    </span>
  }
  <!-- Back button... -->
</div>
```

**Resultado:**
- ✅ Super_admin ve botón "Editar" activo en roles del sistema
- ✅ Usuarios normales ven botón "Solo lectura" deshabilitado
- ✅ Tooltip indica que es un rol del sistema cuando se edita con super_admin

---

### 4. Role Form Component - Advertencia Visual

**Archivo:** `frontend/src/app/features/admin/roles/role-form/role-form.component.ts`

Se agregó un **computed signal** para detectar si se está editando un rol del sistema:

```typescript
// Computed signal: is editing a system role?
isEditingSystemRole = computed(() => {
  return this.role !== null && this.role.isSystem === true;
});
```

**Template HTML actualizado:**

Se agregó una advertencia visual prominente cuando se edita un rol del sistema:

```html
<!-- System Role Warning -->
@if (isEditingSystemRole()) {
  <div class="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 rounded-lg">
    <div class="flex items-start">
      <div class="flex-shrink-0">
        <svg class="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
      </div>
      <div class="ml-3">
        <h3 class="text-sm font-medium text-amber-800">Editando Rol del Sistema</h3>
        <div class="mt-2 text-sm text-amber-700">
          <p>Estás modificando un <strong>rol del sistema</strong>. Ten precaución al cambiar los permisos, ya que puede afectar el funcionamiento de la aplicación.</p>
          <p class="mt-1">Solo los usuarios con permisos de <strong>Super Admin</strong> pueden editar roles del sistema.</p>
        </div>
      </div>
    </div>
  </div>
}
```

**Resultado:**
- ⚠️ Advertencia visual clara cuando se edita un rol del sistema
- ✅ Indica que solo super_admin puede realizar esta acción
- ✅ Advierte sobre el impacto de cambiar permisos de roles del sistema

---

## Archivos Modificados

### Frontend:
- ✅ `frontend/src/app/core/services/auth.service.ts`
- ✅ `frontend/src/app/features/admin/roles/role-list/role-list.component.ts`
- ✅ `frontend/src/app/features/admin/roles/role-list/role-list.component.html`
- ✅ `frontend/src/app/features/admin/roles/role-detail/role-detail.component.ts`
- ✅ `frontend/src/app/features/admin/roles/role-detail/role-detail.component.html`
- ✅ `frontend/src/app/features/admin/roles/role-form/role-form.component.ts`
- ✅ `frontend/src/app/features/admin/roles/role-form/role-form.component.html`

---

## Flujo de Usuario

### Escenario 1: Usuario Normal (Admin) intenta editar rol del sistema

```
1. Usuario con rol "admin" (no super_admin)
2. Navega a /admin/roles
3. Ve la lista de roles con badge "Sistema" / "Personalizado"
4. En roles del sistema: ve botón "Solo lectura" (deshabilitado)
5. En roles personalizados: ve botones "Editar" y "Eliminar" activos
6. Resultado: ❌ No puede editar roles del sistema
```

### Escenario 2: Super Admin edita rol del sistema

```
1. Usuario con rol "super_admin"
2. Navega a /admin/roles
3. Ve todos los roles (sistema y personalizados)
4. En roles del sistema: ve botón "Editar" activo (con tooltip "Editar rol del sistema (Super Admin)")
5. Hace clic en "Editar" del rol "accountant"
6. Ve advertencia amarilla: "⚠️ Editando Rol del Sistema"
7. Modifica permisos (ej: agrega "trip:export")
8. Guarda cambios
9. Resultado: ✅ Rol del sistema actualizado exitosamente
```

### Escenario 3: Super Admin intenta eliminar rol del sistema

```
1. Usuario con rol "super_admin"
2. Navega a /admin/roles
3. Ve rol del sistema (ej: "admin")
4. Resultado: ❌ No hay botón "Eliminar" (ni siquiera para super_admin)
5. Nota: Los roles del sistema NO pueden ser eliminados por nadie
```

---

## Protecciones Implementadas

### ✅ Frontend (UI/UX)

1. **Visibilidad Condicional:** Los botones de edición solo aparecen si `canEdit(role)` retorna `true`
2. **Advertencia Visual:** Banner amarillo prominente al editar roles del sistema
3. **Tooltips Informativos:** Indican que la edición requiere privilegios de super_admin
4. **Consistencia:** Todos los componentes (list, detail, form) siguen la misma lógica

### ✅ Backend (Seguridad Real)

**Importante:** La seguridad real está en el backend (ver `SUPERADMIN_IMPLEMENTATION.md`):

1. **PermissionsGuard:** Super_admin tiene acceso automático a todos los endpoints
2. **RolesService:** Valida el flag `isSuperAdmin` antes de permitir modificaciones
3. **RolesController:** Inyecta el usuario y pasa el flag al servicio
4. **Database RLS:** Protección a nivel de base de datos (PostgreSQL Row-Level Security)

**Nunca confíes solo en la validación del frontend.** El backend siempre valida y rechaza operaciones no autorizadas.

---

## Cómo Probar

### 1. Login como usuario normal (admin):

```bash
# 1. Iniciar frontend
cd frontend
npm start

# 2. Abrir navegador: http://localhost:4200
# 3. Login con credenciales de "admin" (no super_admin)
# 4. Navegar a: /admin/roles
# 5. Verificar que roles del sistema muestran "Solo lectura"
```

### 2. Login como super_admin:

```bash
# 1. Logout del usuario anterior
# 2. Login con credenciales de super_admin
# 3. Navegar a: /admin/roles
# 4. Verificar que roles del sistema tienen botón "Editar" activo
# 5. Hacer clic en "Editar" de un rol del sistema (ej: "accountant")
# 6. Verificar advertencia amarilla: "⚠️ Editando Rol del Sistema"
# 7. Modificar permisos (agregar/quitar)
# 8. Guardar cambios
# 9. Verificar que los cambios se guardaron correctamente
```

### 3. Probar seguridad del backend:

```bash
# Intentar editar rol del sistema sin ser super_admin (bypass frontend)
curl -X PUT http://localhost:3000/api/roles/{system-role-id} \
  -H "Authorization: Bearer {token-de-admin-normal}" \
  -H "X-Tenant-ID: {tenant-id}" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Nuevo Nombre","permissionIds":[...]}'

# Resultado esperado: ❌ Error 400 "System roles cannot be modified. Super admin privileges required."
```

---

## Preguntas Frecuentes

### ¿Los cambios en el frontend afectan a los roles personalizados?

**No.** Los roles personalizados (creados por usuarios) siguen funcionando exactamente igual. Cualquier usuario con permiso `role:update` puede editarlos.

### ¿Qué pasa si desactivo JavaScript en el navegador?

Los controles del frontend son solo para **UX (experiencia de usuario)**. Si alguien intenta editar un rol del sistema sin ser super_admin (manipulando la consola del navegador), el **backend rechazará la operación** con un error 400.

### ¿El super_admin puede eliminar roles del sistema?

**No.** Ni siquiera el super_admin puede eliminar roles del sistema. Solo puede:
- ✅ Editar nombre y descripción
- ✅ Modificar permisos asignados
- ❌ Eliminar el rol

Los roles del sistema son permanentes para garantizar el funcionamiento de la aplicación.

### ¿Cómo sé si soy super_admin?

En el frontend, puedes llamar a `authService.isSuperAdmin()`. En el backend, el guard de permisos te concede acceso automático a todos los endpoints.

---

## Integración con Backend

Este frontend se integra con el backend actualizado (ver `backend/SUPERADMIN_IMPLEMENTATION.md`):

**Backend cambios relevantes:**
- `PermissionsGuard` - Bypass automático para super_admin
- `RolesService.update()` - Acepta parámetro `{ isSuperAdmin: boolean }`
- `RolesController` - Detecta super_admin y pasa flag al servicio

**API Endpoints usados:**
- `GET /api/roles` - Lista todos los roles
- `GET /api/roles/:id` - Obtiene un rol específico
- `PUT /api/roles/:id` - Actualiza un rol (validación de super_admin en backend)
- `POST /api/roles/:id/permissions` - Asigna permisos (validación de super_admin)
- `DELETE /api/roles/:id/permissions` - Remueve permisos (validación de super_admin)

---

## Conclusión

Con esta implementación:

✅ El super_admin puede editar roles del sistema desde la UI
✅ Los usuarios normales siguen viendo roles del sistema como solo lectura
✅ Advertencias visuales claras al editar roles del sistema
✅ Seguridad real implementada en el backend (no solo frontend)
✅ Experiencia de usuario mejorada con tooltips y badges informativos
✅ Consistencia en toda la aplicación (list, detail, form)

Los cambios son **compatibles hacia atrás**: si no eres super_admin, todo funciona como antes (solo lectura para roles del sistema).
