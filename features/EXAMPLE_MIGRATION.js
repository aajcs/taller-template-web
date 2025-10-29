/**
 * Ejemplo de Migración: Inventory Feature
 *
 * Este archivo muestra cómo migrar el módulo de inventario
 * siguiendo la nueva estructura por features.
 *
 * ANTES de hacer cambios, sigue estos pasos:
 */

// ============================================================================
// PASO 1: Crear la estructura de archivos
// ============================================================================
/*
features/inventory/
├── inventory.routes.js      # Router Express
├── inventory.controllers.js # Controladores
├── inventory.services.js    # Lógica de negocio (opcional)
├── index.js                 # Exporta el router
└── tests/
    └── inventory.test.js    # Tests del módulo
*/

// ============================================================================
// PASO 2: Migrar el controller
// ============================================================================
// Copiar contenido de controllers/inventario.js a:
// features/inventory/inventory.controllers.js

// Actualizar imports:
// ANTES:
// const Modelo = require("../models/modelo");
// const { helper } = require("../helpers");

// DESPUÉS:
// const Modelo = require("../../models/modelo");
// const { helper } = require("../../helpers");

// Si usas tenantResolver, filtrar por taller:
/*
const inventarioGets = async (req, res, next) => {
  const query = { 
    eliminado: false,
    // Si hay taller en req, filtrar por él
    ...(req.taller?.id && { tallerId: req.taller.id })
  };
  
  const [total, items] = await Promise.all([
    Inventario.countDocuments(query),
    Inventario.find(query).sort({ createdAt: -1 })
  ]);
  
  res.json({ total, items });
};
*/

// ============================================================================
// PASO 3: Crear el router
// ============================================================================
// features/inventory/inventory.routes.js
/*
const { Router } = require("express");
const { check } = require("express-validator");
const { validarJWT, validarCampos } = require("../../middlewares");
const { tenantResolver } = require("../../core/middleware");

const {
  inventarioGets,
  inventarioGet,
  inventarioPost,
  inventarioPut,
  inventarioDelete,
} = require("./inventory.controllers");

const router = Router();

// Rutas públicas (sin tenant)
router.get("/public", inventarioGets);

// Rutas con tenant (solo para usuarios autenticados y con taller asignado)
router.use(validarJWT);
router.use(tenantResolver); // Valida y resuelve el taller activo

router.get("/", inventarioGets);
router.get("/:id", [
  check("id", "No es un ID válido").isMongoId(),
  validarCampos,
], inventarioGet);

router.post("/", [
  check("nombre", "El nombre es obligatorio").not().isEmpty(),
  validarCampos,
], inventarioPost);

router.put("/:id", [
  check("id", "No es un ID válido").isMongoId(),
  validarCampos,
], inventarioPut);

router.delete("/:id", [
  check("id", "No es un ID válido").isMongoId(),
  validarCampos,
], inventarioDelete);

module.exports = router;
*/

// ============================================================================
// PASO 4: Crear el index.js
// ============================================================================
// features/inventory/index.js
/*
module.exports = require('./inventory.routes');
*/

// ============================================================================
// PASO 5: Actualizar server.js
// ============================================================================
// En models/server.js, cambiar:
// ANTES:
// this.app.use(this.paths.inventario, require("../routes/inventario"));

// DESPUÉS:
// this.app.use(this.paths.inventario, require("../features/inventory"));

// ============================================================================
// PASO 6: (Opcional) Crear wrapper temporal
// ============================================================================
// Si quieres mantener compatibilidad temporal, crear routes/inventario.js:
/*
// routes/inventario.js (wrapper temporal)
module.exports = require('../features/inventory');
*/

// ============================================================================
// PASO 7: Verificar
// ============================================================================
/*
# Ejecutar chequeos
1. Verificar sintaxis: VS Code no muestra errores
2. Levantar servidor: npm start o node app.js
3. Probar endpoint: 
   curl -X GET http://localhost:PORT/api/inventario \
     -H "Authorization: Bearer YOUR_JWT" \
     -H "x-taller-id: TALLER_ID"
4. Verificar que req.taller está disponible en controllers
*/

// ============================================================================
// EJEMPLO COMPLETO: Controller con tenant
// ============================================================================
/*
// features/inventory/inventory.controllers.js
const { response, request } = require("express");
const Inventario = require("../../models/inventario");

const inventarioGets = async (req = request, res = response, next) => {
  try {
    const query = { eliminado: false };
    
    // Si hay tenant resolver activo, filtrar por taller
    if (req.taller?.id) {
      query.tallerId = req.taller.id;
    }
    
    const [total, items] = await Promise.all([
      Inventario.countDocuments(query),
      Inventario.find(query).sort({ createdAt: -1 })
    ]);
    
    res.json({ total, items });
  } catch (error) {
    next(error);
  }
};

const inventarioPost = async (req, res = response, next) => {
  try {
    const data = {
      ...req.body,
      // Asignar el taller activo automáticamente
      tallerId: req.taller?.id,
      createdBy: req.usuario?._id,
    };
    
    const item = new Inventario(data);
    await item.save();
    
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  inventarioGets,
  inventarioPost,
  // ... otras funciones
};
*/

// ============================================================================
// BENEFICIOS DE ESTA ESTRUCTURA
// ============================================================================
/*
1. ✅ Todo el código de inventario en un solo lugar
2. ✅ Multi-tenancy automático con tenantResolver
3. ✅ Imports claros y relativos bien organizados
4. ✅ Fácil de testear (tests junto al código)
5. ✅ Escalable (se puede extraer a un paquete npm si es necesario)
6. ✅ Mantenible (cambios en inventario no afectan otros módulos)
*/

// ============================================================================
// RECOMENDACIONES FINALES
// ============================================================================
/*
- Migrar un módulo a la vez
- Hacer commit después de cada migración exitosa
- Ejecutar tests después de cada cambio
- Documentar cambios específicos si hay lógica compleja
- No borrar archivos antiguos hasta confirmar que todo funciona
*/
