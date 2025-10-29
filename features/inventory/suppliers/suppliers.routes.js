const { Router } = require("express");
const { check } = require("express-validator");
const {
  validarCampos,
  validarJWT,
  tieneRole,
} = require("../../../middlewares");
const {
  suppliersGet,
  supplierGetById,
  supplierPost,
  supplierPut,
  supplierDelete,
} = require("./suppliers.controllers");

const router = Router();
router.use(validarJWT);
router.get("/", suppliersGet);
router.get(
  "/:id",
  [check("id", "No es un id de Mongo válido").isMongoId(), validarCampos],
  supplierGetById
);
router.post(
  "/",
  [check("nombre", "El nombre es obligatorio").not().isEmpty(), validarCampos],
  supplierPost
);
router.put(
  "/:id",
  [check("id", "No es un id de Mongo válido").isMongoId(), validarCampos],
  supplierPut
);
router.delete(
  "/:id",
  [
    tieneRole("superAdmin", "admin"),
    check("id", "No es un id de Mongo válido").isMongoId(),
    validarCampos,
  ],
  supplierDelete
);

module.exports = router;
