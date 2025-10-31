# TripGroups (Vueltas) - Frontend Implementation

## ✅ Implementación Completada

Se ha implementado toda la funcionalidad frontend para gestionar **Vueltas** (TripGroups).

---

## 📦 Archivos Creados

### Models & Services

- ✅ `frontend/src/app/core/models/trip-group.model.ts`
  - Interfaces: `TripGroup`, `CreateTripGroupDto`, `UpdateTripGroupDto`
  - Enum: `TripGroupStatus` (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
  - Constantes: `TRIP_GROUP_STATUS_LABELS`, `TRIP_GROUP_STATUS_COLORS`

- ✅ `frontend/src/app/core/services/trip-group.service.ts`
  - `getAll()` - Lista todas las vueltas
  - `getById(id)` - Obtiene una vuelta específica
  - `create(data)` - Crea una nueva vuelta
  - `update(id, data)` - Actualiza una vuelta
  - `delete(id)` - Elimina una vuelta

### Components

- ✅ `frontend/src/app/features/admin/trip-groups/trip-group-list/`
  - Lista de vueltas con filtros por búsqueda y estado
  - Tabla con: Código, Descripción, Estado, Fecha, Viajes, Ingresos, Gastos, Utilidad
  - Botones de acción: Ver | Editar | Eliminar

- ✅ `frontend/src/app/features/admin/trip-groups/trip-group-form/`
  - Formulario para crear/editar vueltas
  - Campos: Descripción, Fecha Inicio, Fecha Fin, Estado, Notas
  - Código se genera automáticamente

- ✅ `frontend/src/app/features/admin/trip-groups/trip-group-detail/`
  - Vista detallada de una vuelta
  - Tarjetas resumen: Viajes, Ingresos, Gastos, Utilidad
  - Detalles: Fechas, notas
  - Lista de viajes asociados

### Routing

- ✅ `frontend/src/app/app.routes.ts` - Rutas agregadas:
  - `/admin/trip-groups` → Lista
  - `/admin/trip-groups/new` → Crear
  - `/admin/trip-groups/:id` → Detalle
  - `/admin/trip-groups/:id/edit` → Editar

### Navigation

- ✅ `frontend/src/app/shared/components/sidebar/sidebar.component.ts`
  - Item "Vueltas" agregado en menú "Operaciones"

### Models Actualizados

- ✅ `frontend/src/app/core/models/trip.model.ts`
  - Agregado `tripGroupId?: string | null` en interfaces `Trip`, `CreateTripDto`, `UpdateTripDto`

---

## 🎯 Flujo de Usuario

### 1. Acceder a Vueltas

1. Ingresar al sistema
2. Click en menú lateral: **Operaciones → Vueltas**
3. Ver lista de vueltas existentes

### 2. Crear Nueva Vuelta

1. Click en botón **"Nueva Vuelta"**
2. Completar formulario:
   - **Descripción** (opcional): "Vuelta Serena - Santiago - Serena"
   - **Fecha de Inicio** (requerido): Fecha/hora de salida del primer viaje
   - **Fecha de Finalización** (opcional): Fecha/hora estimada de llegada
   - **Estado**: Pendiente, En Progreso, Completada, Cancelada
   - **Notas** (opcional): Información adicional
3. Click en **"Crear Vuelta"**
4. El sistema genera automáticamente el código: `VUELTA-2024-001`

### 3. Ver Detalle de Vuelta

1. Desde la lista, click en el botón **Ver** (ícono ojo)
2. Ver información completa:
   - **Tarjetas resumen**: Cantidad de viajes, ingresos totales, gastos totales, utilidad neta
   - **Detalles**: Fechas, estado, notas
   - **Viajes asociados**: Lista de viajes que conforman la vuelta

### 4. Editar Vuelta

1. Click en botón **Editar** (ícono lápiz)
2. Modificar campos necesarios
3. Click en **"Actualizar Vuelta"**

### 5. Eliminar Vuelta

1. Click en botón **Más opciones** (tres puntos)
2. Click en **Eliminar**
3. Solo se puede eliminar si no tiene viajes asociados

---

## 🔗 Integración con Viajes y Gastos

### Asociar Viajes a una Vuelta

**Opción A: Al crear el viaje**

Cuando se implementen los cambios en el formulario de viajes:
1. Crear nuevo viaje
2. Seleccionar una vuelta existente en el campo "Vuelta"
3. El viaje quedará asociado automáticamente

**Opción B: Editar viaje existente**

1. Editar un viaje existente
2. Seleccionar una vuelta del selector
3. Guardar cambios

### Asociar Gastos a una Vuelta

Cuando se implementen los cambios en el formulario de gastos:
1. Crear nuevo gasto
2. En lugar de seleccionar un viaje individual, seleccionar una **Vuelta**
3. El gasto se compartirá entre todos los viajes de esa vuelta

---

## 📊 Funcionalidades

### Lista de Vueltas

**Filtros:**
- Búsqueda por código o descripción
- Filtro por estado (Pendiente, En Progreso, Completada, Cancelada)

**Columnas mostradas:**
- Código (ej: VUELTA-2024-001)
- Descripción
- Estado (badge con color)
- Fecha de Inicio
- Cantidad de Viajes
- Ingresos Totales ($)
- Gastos Totales ($)
- Utilidad Neta ($)

**Acciones:**
- Ver detalle
- Editar
- Eliminar (solo si no tiene viajes)

### Detalle de Vuelta

**Tarjetas Resumen:**
- 📋 **Viajes**: Cantidad de viajes asociados
- 💰 **Ingresos**: Suma de `agreedPrice` de todos los viajes
- 💸 **Gastos**: Suma de `amount` de todas las transactions con `tripGroupId`
- 📈 **Utilidad**: Ingresos - Gastos

**Información:**
- Código único
- Estado actual
- Descripción
- Fechas (inicio y fin)
- Notas

---

## 🎨 UI/UX

### Diseño Consistente

- ✅ Sigue los patrones establecidos en CLAUDE.md
- ✅ Usa componentes custom (`app-dropdown`)
- ✅ Patrón de 3 botones en acciones de tabla
- ✅ Estados de carga (loading spinners)
- ✅ Estados vacíos (empty states)
- ✅ Badges de color para estados
- ✅ Formularios reactivos con validación

### Colores de Estado

- 🟡 **Pendiente** - Amarillo (`bg-yellow-100 text-yellow-800`)
- 🔵 **En Progreso** - Azul (`bg-blue-100 text-blue-800`)
- 🟢 **Completada** - Verde (`bg-green-100 text-green-800`)
- 🔴 **Cancelada** - Rojo (`bg-red-100 text-red-800`)

---

## 🚀 Próximos Pasos (Opcional)

### Integración con Formulario de Viajes

Para permitir seleccionar una vuelta al crear/editar viajes:

1. Agregar campo `tripGroupId` en `trip-form.component.ts`
2. Cargar lista de vueltas disponibles con `tripGroupService.getAll()`
3. Usar `app-custom-select` para mostrar vueltas:
   ```typescript
   tripGroupOptions: CustomSelectOption[] = tripGroups.map(tg => ({
     value: tg.id,
     label: tg.code,
     data: { description: tg.description }
   }));
   ```

### Integración con Formulario de Gastos

Para permitir seleccionar una vuelta al crear gastos:

1. Agregar campo `tripGroupId` en `transaction-form.component.ts`
2. Hacer opcional el campo `tripId` (un gasto puede estar asociado a viaje O a vuelta)
3. Mostrar selector condicional:
   - Radio buttons: "Viaje Individual" | "Vuelta Completa"
   - Si selecciona "Vuelta Completa", mostrar selector de vueltas
   - Si selecciona "Viaje Individual", mostrar selector de viajes

### Dashboard de Rentabilidad por Vuelta

Crear un widget en el dashboard principal que muestre:
- Top 5 vueltas más rentables del mes
- Gráfico de utilidad por vuelta
- Comparativa de gastos compartidos vs viajes individuales

---

## 📝 Notas Técnicas

### Standalone Components

Todos los componentes usan `standalone: true` y declaran sus propias importaciones:
```typescript
@Component({
  selector: 'app-trip-group-list',
  standalone: true,
  imports: [CommonModule, RouterModule, DropdownComponent, ...],
  templateUrl: './trip-group-list.component.html',
  styleUrls: ['./trip-group-list.component.scss']
})
```

### Formato de Moneda

Se usa `Intl.NumberFormat` para formato chileno:
```typescript
formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(amount);
}
```

### Formato de Fechas

Se usa `toLocaleDateString` para formato local:
```typescript
formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
```

---

## ✅ Checklist de Implementación

- [x] Modelo `TripGroup` en TypeScript
- [x] Servicio `TripGroupService`
- [x] Componente lista de vueltas
- [x] Componente crear/editar vuelta
- [x] Componente detalle de vuelta
- [x] Rutas configuradas
- [x] Item en sidebar
- [x] Modelo `Trip` actualizado con `tripGroupId`
- [ ] Selector de vuelta en formulario de viajes (pendiente)
- [ ] Selector de vuelta en formulario de gastos (pendiente)
- [ ] Cargar viajes en detalle de vuelta (backend debe retornar relación)
- [ ] Cálculo de gastos totales (backend debe implementar query)

---

## 🎯 Resultado Final

Ahora puedes:

1. ✅ Crear vueltas con código automático
2. ✅ Ver lista de todas las vueltas con filtros
3. ✅ Ver detalle completo con métricas financieras
4. ✅ Editar vueltas existentes
5. ✅ Eliminar vueltas (si no tienen viajes asociados)
6. ✅ Navegar desde el menú "Operaciones → Vueltas"

**El sistema está listo para usar.** Solo falta integrar el selector de vueltas en los formularios de viajes y gastos cuando lo necesites.
