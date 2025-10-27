const { Router } = require("express");
const { check } = require("express-validator");

const { validarCampos, validarJWT, tieneRole } = require("../../middlewares");
const {
  existeRecepcionBKPorId,
  existeContratoBKPorId,
  existeLineaCargaBKPorId,
  existeBunkeringPorId,
  existeMuellePorId,
  existeEmbarcacionPorId,
  existeProductoBKPorId,
  existeTanqueBKPorId,
} = require("../../helpers/db-validators");

const {
  recepcionBKGets,
  recepcionBKGet,
  recepcionBKPost,
  recepcionBKPut,
  recepcionBKDelete,
  recepcionBKPatch,
} = require("../../controllers/bunkering/recepcionBK");

const router = Router();

// Obtener todas lasrecepcionBKes
router.get("/", [validarJWT], recepcionBKGets);

// Obtener una recepción por ID
router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeRecepcionBKPorId),
    validarCampos,
  ],
  recepcionBKGet
);

// Crear una nueva recepción
router.post(
  "/",
  [
    validarJWT,
    check("idContrato", "El ID del contrato es obligatorio").not().isEmpty(),
    check("idContrato", "No es un ID válido").isMongoId(),
    check("idContrato").custom(existeContratoBKPorId),
    // check("idLinea", "El ID de la línea es obligatorio").not().isEmpty(),
    // check("idLinea", "No es un ID válido").isMongoId(),
    // check("idLinea").custom(existeLineaCargaBKPorId),
    check("idBunkering", "El ID del bunkering es obligatorio").not().isEmpty(),
    check("idBunkering", "No es un ID válido").isMongoId(),
    check("idBunkering").custom(existeBunkeringPorId),
    // check("idMuelle", "El ID del muelle es obligatorio").not().isEmpty(),
    // check("idMuelle", "No es un ID válido").isMongoId(),
    // check("idMuelle").custom(existeMuellePorId),
    // check("idEmbarcacion", "El ID de la embarcación es obligatorio")
    //   .not()
    //   .isEmpty(),
    // check("idEmbarcacion", "No es un ID válido").isMongoId(),
    // check("idEmbarcacion").custom(existeEmbarcacionPorId),
    // check("idProductoBK", "El ID del producto es obligatorio").not().isEmpty(),
    // check("idProductoBK", "No es un ID válido").isMongoId(),
    // check("idProductoBK").custom(existeProductoBKPorId),
    // check("idTanque", "El ID del tanque es obligatorio").not().isEmpty(),
    // check("idTanque", "No es un ID válido").isMongoId(),
    // check("idTanque").custom(existeTanqueBKPorId),
    validarCampos,
  ],
  recepcionBKPost
);

// Actualizar una recepción existente
router.put(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeRecepcionBKPorId),
    validarCampos,
  ],
  recepcionBKPut
);

// Eliminar (marcar como eliminada) una recepción
router.delete(
  "/:id",
  [
    validarJWT,
    tieneRole("superAdmin", "admin"),
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeRecepcionBKPorId),
    validarCampos,
  ],
  recepcionBKDelete
);

// Actualizar parcialmente una recepción
router.patch(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeRecepcionBKPorId),
    validarCampos,
  ],
  recepcionBKPatch
);

module.exports = router;
