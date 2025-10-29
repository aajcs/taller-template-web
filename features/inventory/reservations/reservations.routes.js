const { Router } = require("express");
const { check } = require("express-validator");
const {
  validarCampos,
  validarJWT,
  tieneRole,
} = require("../../../middlewares");
const {
  reservationsGet,
  reservationGetById,
  reservationPost,
  reservationPut,
  reservationDelete,
} = require("./reservations.controllers");

const router = Router();
router.use(validarJWT);
router.get("/", reservationsGet);
router.get(
  "/:id",
  [check("id", "No es un id de Mongo válido").isMongoId(), validarCampos],
  reservationGetById
);
router.post(
  "/",
  [
    check("item", "Item es obligatorio").not().isEmpty(),
    check("warehouse", "Warehouse es obligatorio").not().isEmpty(),
    validarCampos,
  ],
  reservationPost
);
router.put(
  "/:id",
  [check("id", "No es un id de Mongo válido").isMongoId(), validarCampos],
  reservationPut
);
router.delete(
  "/:id",
  [
    tieneRole("superAdmin", "admin"),
    check("id", "No es un id de Mongo válido").isMongoId(),
    validarCampos,
  ],
  reservationDelete
);

module.exports = router;
