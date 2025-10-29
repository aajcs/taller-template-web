const { Router } = require("express");
const { check } = require("express-validator");
const {
  validarCampos,
  validarJWT,
  tieneRole,
} = require("../../../middlewares");
const {
  brandsGet,
  brandGetById,
  brandPost,
  brandPut,
  brandDelete,
} = require("./brands.controllers");

const router = Router();

router.use(validarJWT);

router.get("/", brandsGet);
router.get(
  "/:id",
  [check("id", "No es un id de Mongo válido").isMongoId(), validarCampos],
  brandGetById
);
router.post(
  "/",
  [check("nombre", "El nombre es obligatorio").not().isEmpty(), validarCampos],
  brandPost
);
router.put(
  "/:id",
  [check("id", "No es un id de Mongo válido").isMongoId(), validarCampos],
  brandPut
);
router.delete(
  "/:id",
  [
    tieneRole("superAdmin", "admin"),
    check("id", "No es un id de Mongo válido").isMongoId(),
    validarCampos,
  ],
  brandDelete
);

module.exports = router;
