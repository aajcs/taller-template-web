const { Router } = require("express");
const { check } = require("express-validator");
const {
  validarCampos,
  validarJWT,
  tieneRole,
} = require("../../../middlewares");
const {
  modelsGet,
  modelGetById,
  modelPost,
  modelPut,
  modelDelete,
} = require("./models.controllers");

const router = Router();

router.use(validarJWT);

router.get("/", modelsGet);
router.get(
  "/:id",
  [check("id", "No es un id de Mongo válido").isMongoId(), validarCampos],
  modelGetById
);
router.post(
  "/",
  [check("nombre", "El nombre es obligatorio").not().isEmpty(), validarCampos],
  modelPost
);
router.put(
  "/:id",
  [check("id", "No es un id de Mongo válido").isMongoId(), validarCampos],
  modelPut
);
router.delete(
  "/:id",
  [
    tieneRole("superAdmin", "admin"),
    check("id", "No es un id de Mongo válido").isMongoId(),
    validarCampos,
  ],
  modelDelete
);

module.exports = router;
