const { Router } = require("express");
const { check } = require("express-validator");
const {
  validarCampos,
  validarJWT,
  tieneRole,
} = require("../../../middlewares");
const {
  ordersGet,
  orderGetById,
  orderPost,
  orderPut,
  orderDelete,
} = require("./orders.controllers");

const router = Router();
router.use(validarJWT);
router.get("/", ordersGet);
router.get(
  "/:id",
  [check("id", "No es un id de Mongo válido").isMongoId(), validarCampos],
  orderGetById
);
router.post(
  "/",
  [
    check("proveedor", "Proveedor es obligatorio").not().isEmpty(),
    validarCampos,
  ],
  orderPost
);
router.put(
  "/:id",
  [check("id", "No es un id de Mongo válido").isMongoId(), validarCampos],
  orderPut
);
router.delete(
  "/:id",
  [
    tieneRole("superAdmin", "admin"),
    check("id", "No es un id de Mongo válido").isMongoId(),
    validarCampos,
  ],
  orderDelete
);

module.exports = router;
