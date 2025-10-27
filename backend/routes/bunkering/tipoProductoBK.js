const { Router } = require("express");
const { check } = require("express-validator");

const { validarCampos, validarJWT, tieneRole } = require("../../middlewares");
const {
  existeBunkeringPorId,
  existeProductoBKPorId,
  existeTipoProductoBKPorId,
} = require("../../helpers/db-validators");

const {
  tipoProductoBKGets,
  tipoProductoBKGet,
  tipoProductoBKPost,
  tipoProductoBKPut,
  tipoProductoBKDelete,
  tipoProductoBKPatch,
} = require("../../controllers/bunkering/tipoProductoBK");

const router = Router();

// Obtener todos los tipos de producto
router.get("/", [validarJWT], tipoProductoBKGets);

// Obtener un tipo de producto por ID
router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeTipoProductoBKPorId),
    validarCampos,
  ],
  tipoProductoBKGet
);

// Crear un nuevo tipo de producto
router.post(
  "/",
  [
    validarJWT,
    check("idBunkering", "El ID del bunkering es obligatorio").not().isEmpty(),
    check("idBunkering", "No es un ID válido").isMongoId(),
    check("idBunkering").custom(existeBunkeringPorId),
    check("idProducto", "El ID del producto es obligatorio").not().isEmpty(),
    check("idProducto", "No es un ID válido").isMongoId(),
    check("idProducto").custom(existeProductoBKPorId),
    check("nombre", "El nombre es obligatorio").not().isEmpty(),
    check("clasificacion", "La clasificación es obligatoria").not().isEmpty(),
    check("gravedadAPI", "La gravedad API es obligatoria").not().isEmpty(),
    check("azufre", "El azufre es obligatorio").not().isEmpty(),
    check("contenidoAgua", "El contenido de agua es obligatorio")
      .not()
      .isEmpty(),
    check("procedencia", "La procedencia es obligatoria").not().isEmpty(),
    validarCampos,
  ],
  tipoProductoBKPost
);

// Actualizar un tipo de producto por ID
router.put(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeTipoProductoBKPorId),
    validarCampos,
  ],
  tipoProductoBKPut
);

// Eliminar (marcar como eliminado) un tipo de producto por ID
router.delete(
  "/:id",
  [
    validarJWT,
    tieneRole("superAdmin", "admin"),
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeTipoProductoBKPorId),
    validarCampos,
  ],
  tipoProductoBKDelete
);

// Actualizar parcialmente un tipo de producto (opcional)
router.patch(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeTipoProductoBKPorId),
    validarCampos,
  ],
  tipoProductoBKPatch
);

module.exports = router;
