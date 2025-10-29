const { Router } = require("express");
const { check } = require("express-validator");

const {
  validarCampos,
  validarJWT,
  esSuperAdminRole,
  tieneRole,
} = require("../../middlewares");

const { existeRefineriaPorId } = require("../../helpers/db-validators");

const {
  workshopsGet,
  workshopGetById,
  workshopPost,
  workshopPut,
  workshopDelete,
  workshopPatch,
} = require("./workshop.controllers");

const router = Router();

// Obtener todos los talleres
router.get("/", [validarJWT], workshopsGet);

// Obtener un taller por ID
router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un id de Mongo válido").isMongoId(),
    validarCampos,
  ],
  workshopGetById
);

// Actualizar un taller
router.put(
  "/:id",
  [
    validarJWT,
    esSuperAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeRefineriaPorId),
    validarCampos,
  ],
  workshopPut
);

// Crear un nuevo taller
router.post(
  "/",
  [
    validarJWT,
    esSuperAdminRole,
    check("ubicacion", "La ubicación es obligatoria").not().isEmpty(),
    check("nombre", "El nombre del taller es obligatorio").not().isEmpty(),
    check("rif", "El RIF es obligatorio").not().isEmpty(),
    check("img", "El logotipo del taller es obligatorio").not().isEmpty(),
    validarCampos,
  ],
  workshopPost
);

// Eliminar (lógicamente) un taller
router.delete(
  "/:id",
  [
    validarJWT,
    esSuperAdminRole,
    tieneRole("superAdmin", "admin"),
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeRefineriaPorId),
    validarCampos,
  ],
  workshopDelete
);

// PATCH no implementado
router.patch("/", workshopPatch);

module.exports = router;
