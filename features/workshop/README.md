# Workshop Feature

Feature para la gestión de talleres/refinerías en el sistema.

## Descripción

Este módulo maneja toda la lógica relacionada con los talleres (workshops/refinerías), que son las entidades principales del sistema de multi-tenancy. Cada usuario puede tener acceso a uno o varios talleres dependiendo de su nivel de permisos.

## Estructura

```
features/workshop/
├── workshop.models.js      # Modelo Mongoose para Workshop
├── workshop.controllers.js # Controladores (lógica de negocio)
├── workshop.routes.js      # Rutas Express
├── index.js               # Exporta el router
└── README.md              # Esta documentación
```

## Modelo Workshop

### Campos principales:

- **nombre**: Nombre del taller (único, obligatorio)
- **nit**: Número de Identificación Tributaria (único, obligatorio)
- **ubicacion**: Dirección física del taller
- **telefono**: Teléfono de contacto
- **procesamientoDia**: Capacidad de procesamiento diario
- **legal**: Representante legal
- **img**: Logo del taller (URL)
- **estado**: Estado del taller (activo/inactivo)
- **eliminado**: Flag para eliminación lógica

### Campos de auditoría (automáticos):

- **createdBy**: Usuario que creó el registro
- **createdAt**: Fecha de creación
- **updatedAt**: Fecha de última actualización
- **historial**: Array con historial de modificaciones

## Endpoints

### `GET /api/workshops`

Obtiene todos los talleres no eliminados.

**Autenticación**: Requerida (JWT)

**Respuesta**:

```json
{
  "total": 10,
  "workshops": [
    {
      "_id": "...",
      "nombre": "Taller Central",
      "nit": "123456789",
      "ubicacion": "Calle Principal 123",
      "procesamientoDia": 5000,
      "estado": "activo",
      ...
    }
  ]
}
```

### `GET /api/workshops/:id`

Obtiene un taller específico por ID.

**Autenticación**: Requerida (JWT)

**Parámetros**: `id` - MongoDB ObjectId del taller

**Respuesta**: Objeto workshop con historial y relaciones populadas

### `POST /api/workshops`

Crea un nuevo taller.

**Autenticación**: Requerida (JWT + Rol SuperAdmin)

**Body**:

```json
{
  "nombre": "Taller Nuevo",
  "nit": "987654321",
  "ubicacion": "Avenida 456",
  "telefono": "1234567890",
  "procesamientoDia": 3000,
  "legal": "Juan Pérez",
  "img": "https://example.com/logo.png"
}
```

**Validaciones**:

- `ubicacion`: Obligatorio
- `nombre`: Obligatorio
- `nit`: Obligatorio
- `img`: Obligatorio

### `PUT /api/workshops/:id`

Actualiza un taller existente.

**Autenticación**: Requerida (JWT + Rol SuperAdmin)

**Parámetros**: `id` - MongoDB ObjectId del taller

**Body**: Campos a actualizar (parcial)

### `DELETE /api/workshops/:id`

Elimina lógicamente un taller (marca `eliminado: true`).

**Autenticación**: Requerida (JWT + Rol SuperAdmin/Admin)

**Parámetros**: `id` - MongoDB ObjectId del taller

## Multi-tenancy

El modelo Workshop es la base del sistema multi-tenant:

1. Cada usuario tiene un campo `idRefineria` que referencia a uno o más talleres
2. Los usuarios con `acceso: 'limitado'` solo pueden ver datos de su taller asignado
3. Los usuarios con `acceso: 'completo'` pueden ver todos los talleres
4. El middleware `tenantResolver` valida y resuelve el taller activo en cada request

## Permisos

| Acción | Roles permitidos     |
| ------ | -------------------- |
| GET    | Todos (autenticados) |
| POST   | SuperAdmin           |
| PUT    | SuperAdmin           |
| DELETE | SuperAdmin, Admin    |

## Relaciones

El modelo Workshop se relaciona con:

- **User**: Usuarios asignados al taller (`idRefineria`)
- **Tanque**: Tanques del taller
- **Torre**: Torres del taller
- **Bomba**: Bombas del taller
- **Inventario**: Inventario del taller
- **Recepción**: Recepciones del taller
- **Despacho**: Despachos del taller
- **Refinación**: Procesos de refinación
- Y otros módulos operacionales

## Migraciones

### Compatibilidad con código existente

Se creó un wrapper en `models/workshop.js` que re-exporta el modelo desde `features/workshop/workshop.models.js`. Esto permite:

1. Usar `require('../models/workshop')` en código existente
2. Usar `require('../features/workshop/workshop.models')` en código nuevo
3. Migración gradual sin romper funcionalidad

### Relación con modelo Refineria

El modelo `Workshop` reemplaza progresivamente al modelo `Refineria`:

- `Refineria` es el nombre antiguo (en español)
- `Workshop` es el nombre nuevo (en inglés, siguiendo convenciones)
- Ambos modelos coexisten durante la migración
- El objetivo es consolidar todo en `Workshop`

## Uso en código

### Importar el modelo:

```javascript
// Forma nueva (recomendada)
const Workshop = require("../features/workshop/workshop.models");

// Forma compatible
const Workshop = require("../models/workshop");
```

### Ejemplo de uso en controller:

```javascript
const { tenantResolver } = require("../../core/middleware");

router.get("/inventario", tenantResolver, async (req, res) => {
  const tallerId = req.taller.id; // Resuelto por tenantResolver

  const items = await Inventario.find({
    idRefineria: tallerId,
    eliminado: false,
  });

  res.json(items);
});
```

## Testing

Los tests deben cubrir:

- ✅ CRUD completo
- ✅ Validaciones de campos obligatorios
- ✅ Unicidad de nombre y NIT
- ✅ Permisos por rol
- ✅ Eliminación lógica
- ✅ Auditoría (createdBy, historial)

## Próximos pasos

1. Migrar código que usa `models/refineria` a `models/workshop`
2. Actualizar referencias en controllers existentes
3. Crear tests para el feature
4. Deprecar el modelo `Refineria` una vez completada la migración
