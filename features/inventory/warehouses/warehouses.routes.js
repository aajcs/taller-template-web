const { Router } = require("express");
const { check } = require("express-validator");
const {
  validarCampos,
  validarJWT,
  tieneRole,
} = require("../../../middlewares");
const {
  warehousesGet,
  warehouseGetById,
  warehousePost,
  warehousePut,
  warehouseDelete,
} = require("./warehouses.controllers");
const router = Router();
router.use(validarJWT);
router.get("/", warehousesGet);
router.get(
  "/:id",
  [check("id", "No es un id de Mongo válido").isMongoId(), validarCampos],
  warehouseGetById
);
router.post(
  "/",
  [check("nombre", "El nombre es obligatorio").not().isEmpty(), validarCampos],
  warehousePost
);
router.put(
  "/:id",
  [check("id", "No es un id de Mongo válido").isMongoId(), validarCampos],
  warehousePut
);
router.delete(
  "/:id",
  [
    tieneRole("superAdmin", "admin"),
    check("id", "No es un id de Mongo válido").isMongoId(),
    validarCampos,
  ],
  warehouseDelete
);
module.exports = router;
