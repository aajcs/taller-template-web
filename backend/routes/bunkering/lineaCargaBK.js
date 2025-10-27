const { Router } = require("express");
const { check } = require("express-validator");

const { validarCampos, validarJWT, tieneRole } = require("../../middlewares");
const { existeMuellePorId } = require("../../helpers/db-validators");

const {
  lineaCargaBKGets,
  lineaCargaBKGet,
  lineaCargaBKPost,
  lineaCargaBKPut,
  lineaCargaBKDelete,
} = require("../../controllers/bunkering/lineaCargaBK");

const router = Router();

// Obtener todas las líneas de carga
router.get("/", [validarJWT], lineaCargaBKGets);

// Obtener una línea de carga por ID
router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    validarCampos,
  ],
  lineaCargaBKGet
);

// Crear una nueva línea de carga
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
  lineaCargaBKPost
);

// Actualizar una línea de carga por ID
router.put(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    validarCampos,
  ],
  lineaCargaBKPut
);

// Eliminar (marcar como eliminada) una línea de carga por ID
router.delete(
  "/:id",
  [
    validarJWT,
    tieneRole("superAdmin", "admin"),
    check("id", "No es un ID válido").isMongoId(),
    validarCampos,
  ],
  lineaCargaBKDelete
);

module.exports = router;