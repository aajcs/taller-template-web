const { Router } = require("express");
const { check } = require("express-validator");

const { validarCampos, validarJWT, tieneRole } = require("../../middlewares");

const { existeTanqueBKPorId } = require("../../helpers/db-validators");

const {
  tanqueGet,
  tanquePut,
  tanquePost,
  tanqueDelete,
  tanquePatch,
  tanqueGets,
} = require("../../controllers/bunkering/tanqueBK");

const router = Router();

// Obtener todos los tanques
router.get("/", [validarJWT], tanqueGets);

// Obtener un tanque por ID
router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeTanqueBKPorId),
    validarCampos,
  ],
  tanqueGet
);

// Actualizar un tanque por ID
router.put(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeTanqueBKPorId),
    validarCampos,
  ],
  tanquePut
);

// Crear un nuevo tanque
router.post(
  "/",
  [
    validarJWT,
    check("nombre", "El nombre del tanque es obligatorio").not().isEmpty(),
    check("capacidad", "La capacidad del tanque es obligatoria")
      .not()
      .isEmpty(),
    check("capacidad", "La capacidad debe ser un número positivo").isFloat({
      min: 0,
    }),
    validarCampos,
  ],
  tanquePost
);

// Eliminar (marcar como eliminado) un tanque por ID
router.delete(
  "/:id",
  [
    validarJWT,
    tieneRole("superAdmin", "admin"),
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeTanqueBKPorId),
    validarCampos,
  ],
  tanqueDelete
);

// Actualizar parcialmente un tanque
router.patch(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeTanqueBKPorId),
    validarCampos,
  ],
  tanquePatch
);

module.exports = router;
