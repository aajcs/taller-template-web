const { Router } = require("express");
const { check } = require("express-validator");

const {
  validarCampos,
  validarJWT,
  esAdminRole,
  tieneRole,
} = require("../middlewares");

const {
  existeOperadorPorId,
  existeRefineriaPorId,
} = require("../helpers/db-validators");

const {
  operadorGet,
  operadorPut,
  operadorPost,
  operadorDelete,
  operadorPatch,
  operadorGets,
} = require("../controllers/operador");

const router = Router();

// Obtener todos los operadores
router.get("/", operadorGets);

// Obtener un operador específico por ID
router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un id de Mongo válido").isMongoId(),
    check("id").custom(existeOperadorPorId),
    validarCampos,
  ],
  operadorGet
);

// Actualizar un operador por ID
router.put(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeOperadorPorId),
    check("idRefineria", "No es un ID válido de refinería")
      .optional()
      .isMongoId()
      .custom(existeRefineriaPorId),
    validarCampos,
  ],
  operadorPut
);

// Crear un nuevo operador
router.post(
  "/",
  [
    validarJWT,
    check("nombre", "El nombre del operador es obligatorio").not().isEmpty(),
    check("nombre", "El nombre debe tener al menos 3 caracteres").isLength({
      min: 3,
    }),
    check("cargo", "El cargo del operador es obligatorio").not().isEmpty(),
    check("cargo", "El cargo debe tener al menos 3 caracteres").isLength({
      min: 3,
    }),
    check("idRefineria", "No es un ID válido de refinería").isMongoId(),
    check("idRefineria").custom(existeRefineriaPorId),
    validarCampos,
  ],
  operadorPost
);

// Eliminar (marcar como eliminado) un operador por ID
router.delete(
  "/:id",
  [
    validarJWT,
    tieneRole("superAdmin", "admin"),
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeOperadorPorId),
    validarCampos,
  ],
  operadorDelete
);

// Manejar solicitudes PATCH (ejemplo básico)
router.patch("/", [validarJWT], operadorPatch);

module.exports = router;
