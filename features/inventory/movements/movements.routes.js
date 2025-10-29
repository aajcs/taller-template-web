const { Router } = require("express");
const { check } = require("express-validator");
const {
  validarCampos,
  validarJWT,
  tieneRole,
} = require("../../../middlewares");
const {
  movementsGet,
  movementPost,
  movementGetById,
} = require("./movements.controllers");

const router = Router();
router.use(validarJWT);
router.get("/", movementsGet);
router.get(
  "/:id",
  [check("id", "No es un id de Mongo válido").isMongoId(), validarCampos],
  movementGetById
);
router.post(
  "/",
  [
    check("tipo", "Tipo es obligatorio").not().isEmpty(),
    check("item", "Item es obligatorio").not().isEmpty(),
    validarCampos,
  ],
  movementPost
);

module.exports = router;
