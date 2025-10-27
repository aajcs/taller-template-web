const { Router } = require("express");
const { check } = require("express-validator");

const { validarCampos, validarJWT, tieneRole } = require("../../middlewares");
const { existeMuellePorId } = require("../../helpers/db-validators");

const {
  lineaDespachoBKGets,
  lineaDespachoBKGet,
  lineaDespachoBKPost,
  lineaDespachoBKPut,
  lineaDespachoBKDelete,
} = require("../../controllers/bunkering/lineaDespachoBK");

const router = Router();

// Obtener todas las líneas de despacho
router.get("/", [validarJWT], lineaDespachoBKGets);

// Obtener una línea de despacho por ID
router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    validarCampos,
  ],
  lineaDespachoBKGet
);

// Crear una nueva línea de despacho
router.post(
  "/",
  [
    validarJWT,
    check("idMuelle", "El ID del muelle es obligatorio").not().isEmpty(),
    check("idMuelle", "No es un ID válido").isMongoId(),
    check("idMuelle").custom(existeMuellePorId),
    check("nombre", "El nombre de la línea es obligatorio").not().isEmpty(),
    validarCampos,
  ],
  lineaDespachoBKPost
);

// Actualizar una línea de despacho por ID
router.put(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    validarCampos,
  ],
  lineaDespachoBKPut
);

// Eliminar (marcar como eliminada) una línea de despacho por ID
router.delete(
  "/:id",
  [
    validarJWT,
    tieneRole("superAdmin", "admin"),
    check("id", "No es un ID válido").isMongoId(),
    validarCampos,
  ],
  lineaDespachoBKDelete
);

module.exports = router;