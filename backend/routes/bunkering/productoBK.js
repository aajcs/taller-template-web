const { Router } = require("express");
const { check } = require("express-validator");

const { validarCampos, validarJWT, tieneRole } = require("../../middlewares");
const {
  existeBunkeringPorId,
  existeProductoBKPorId,
} = require("../../helpers/db-validators");

const {
  productoBKGets,
  productoBKGet,
  productoBKPost,
  productoBKPut,
  productoBKDelete,
  // productoBKPatch, // Si tienes PATCH, descomenta esta línea
} = require("../../controllers/bunkering/productoBK");

const router = Router();

// Obtener todos los productos
router.get("/", [validarJWT], productoBKGets);

// Obtener un producto por ID
router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeProductoBKPorId),
    validarCampos,
  ],
  productoBKGet
);

// Crear un nuevo producto
router.post(
  "/",
  [
    validarJWT,
    check("idBunkering", "El ID del bunkering es obligatorio").not().isEmpty(),
    check("idBunkering", "No es un ID válido").isMongoId(),
    check("idBunkering").custom(existeBunkeringPorId),
    check("nombre", "El nombre del producto es obligatorio").not().isEmpty(),
    check("posicion", "La posición del producto es obligatoria").not().isEmpty(),
    check("color", "El color del producto es obligatorio").not().isEmpty(),
    check("tipoMaterial", "El tipo de material es obligatorio").not().isEmpty(),
    validarCampos,
  ],
  productoBKPost
);

// Actualizar un producto por ID
router.put(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeProductoBKPorId),
    validarCampos,
  ],
  productoBKPut
);

// Eliminar (marcar como eliminado) un producto por ID
router.delete(
  "/:id",
  [
    validarJWT,
    tieneRole("superAdmin", "admin"),
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeProductoBKPorId),
    validarCampos,
  ],
  productoBKDelete
);

// // Actualizar parcialmente un producto (descomenta si tienes PATCH)
// // router.patch(
// //   "/:id",
// //   [
// //     validarJWT,
// //     check("id", "No es un ID válido").isMongoId(),
// //     check("id").custom(existeProductoBKPorId),
// //     validarCampos,
// //   ],
// //   productoBKPatch
// // );

module.exports = router;