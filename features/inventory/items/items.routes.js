const { Router } = require("express");
const { check } = require("express-validator");
const {
  validarCampos,
  validarJWT,
  tieneRole,
} = require("../../../middlewares");
// const { existeItemPorId } = require("../../helpers/db-validators") || {}; // placeholder if helper exists

const {
  itemsGet,
  itemGetById,
  itemPost,
  itemPut,
  itemDelete,
} = require("./items.controllers");

const router = Router();

router.use(validarJWT);

router.get("/", itemsGet);
router.get(
  "/:id",
  [check("id", "No es un id de Mongo válido").isMongoId(), validarCampos],
  itemGetById
);
router.post(
  "/",
  [check("nombre", "El nombre es obligatorio").not().isEmpty(), validarCampos],
  itemPost
);
router.put(
  "/:id",
  [check("id", "No es un id de Mongo válido").isMongoId(), validarCampos],
  itemPut
);
router.delete(
  "/:id",
  [
    tieneRole("superAdmin", "admin"),
    check("id", "No es un id de Mongo válido").isMongoId(),
    validarCampos,
  ],
  itemDelete
);

module.exports = router;
