const { Router } = require("express");
const { check } = require("express-validator");

const { validarCampos, validarJWT, tieneRole } = require("../../middlewares");
const {
  existeDespachoBKPorId,
  existeContratoBKPorId,
  existeLineaCargaBKPorId,
  existeBunkeringPorId,
  existeMuellePorId,
  existeEmbarcacionPorId,
  existeProductoBKPorId,
  existeTanqueBKPorId,
} = require("../../helpers/db-validators");

const {
  despachoBKGets,
  despachoBKGet,
  despachoBKPost,
  despachoBKPut,
  despachoBKDelete,
  despachoBKPatch,
} = require("../../controllers/bunkering/despachoBK");

const router = Router();

// Obtener todas las recepciones
router.get("/", [validarJWT], despachoBKGets);

// Obtener una despacho por ID
router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeDespachoBKPorId),
    validarCampos,
  ],
  despachoBKGet
);

// Crear una nueva despacho
router.post(
  "/",
  [
    validarJWT,
    check("idContrato", "El ID del contrato es obligatorio").not().isEmpty(),
    check("idContrato", "No es un ID válido").isMongoId(),
    check("idContrato").custom(existeContratoBKPorId),
    check("idBunkering", "El ID del bunkering es obligatorio").not().isEmpty(),
    check("idBunkering", "No es un ID válido").isMongoId(),
    check("idBunkering").custom(existeBunkeringPorId),

    validarCampos,
  ],
  despachoBKPost
);

// Actualizar una despacho existente
router.put(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeDespachoBKPorId),
    validarCampos,
  ],
  despachoBKPut
);

// Eliminar (marcar como eliminada) una despacho
router.delete(
  "/:id",
  [
    validarJWT,
    tieneRole("superAdmin", "admin"),
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeDespachoBKPorId),
    validarCampos,
  ],
  despachoBKDelete
);

// Actualizar parcialmente un despacho
router.patch(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeDespachoBKPorId),
    validarCampos,
  ],
  despachoBKPatch
);

module.exports = router;
