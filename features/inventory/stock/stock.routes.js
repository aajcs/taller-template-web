const { Router } = require("express");
const { check } = require("express-validator");
const {
  validarCampos,
  validarJWT,
  tieneRole,
} = require("../../../middlewares");
const {
  stockGetAll,
  stockGetById,
  stockPost,
  stockPut,
  stockDelete,
} = require("./stock.controllers");
const router = Router();

router.use(validarJWT);
router.get("/", stockGetAll);
router.get(
  "/:id",
  [check("id", "No es un id de Mongo válido").isMongoId(), validarCampos],
  stockGetById
);
router.post(
  "/",
  [
    check("item", "Item es obligatorio").not().isEmpty(),
    check("warehouse", "Warehouse es obligatorio").not().isEmpty(),
    validarCampos,
  ],
  stockPost
);
router.put(
  "/:id",
  [check("id", "No es un id de Mongo válido").isMongoId(), validarCampos],
  stockPut
);
router.delete(
  "/:id",
  [
    tieneRole("superAdmin", "admin"),
    check("id", "No es un id de Mongo válido").isMongoId(),
    validarCampos,
  ],
  stockDelete
);

module.exports = router;
