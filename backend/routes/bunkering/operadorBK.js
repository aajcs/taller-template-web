const { Router } = require("express");
const { check } = require("express-validator");
const { validarCampos, validarJWT, tieneRole } = require("../../middlewares");

const {
  existeOperadorBKPorId,
  existeBunkeringPorId,
} = require("../../helpers/db-validators");

const {
  operadorBKGet,
  operadorBKPut,
  operadorBKPost,
  operadorBKDelete,
  operadorBKPatch,
  operadorBKGets,
} = require("../../controllers/bunkering/operadorBK");

const router = Router();

// Obtener todos los operadores
router.get("/", [validarJWT], operadorBKGets);

// Obtener un operador específico por ID
router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeOperadorBKPorId),
    validarCampos,
  ],
  operadorBKGet
);

// Actualizar un operador por ID
router.put(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeOperadorBKPorId),
    check("idBunkering", "No es un ID válido de refinería")
      .optional()
      .isMongoId()
      .custom(existeBunkeringPorId),
    validarCampos,
  ],
  operadorBKPut
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
    check("idBunkering", "No es un ID válido de refinería").isMongoId(),
    check("idBunkering").custom(existeBunkeringPorId),
    validarCampos,
  ],
  operadorBKPost
);

// Eliminar (marcar como eliminado) un operador por ID
router.delete(
  "/:id",
  [
    validarJWT,
    tieneRole("superAdmin", "admin"),
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeOperadorBKPorId),
    validarCampos,
  ],
  operadorBKDelete
);

// Manejar solicitudes PATCH
router.patch(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeOperadorBKPorId),
    validarCampos,
  ],
  operadorBKPatch
);

module.exports = router;
