const { Router } = require("express");
const { check } = require("express-validator");

const {
  validarCampos,
  validarJWT,
  esAdminRole,
  tieneRole,
} = require("../middlewares");

const {
  existeLineaFacturaPorId,
} = require("../helpers/db-validators");

const {
  lineaFacturaGets,
  lineaFacturaGet,
} = require("../controllers/lineaFactura");

const router = Router();

router.get("/", lineaFacturaGets);

router.get(
  "/:id",
  [
    check("id", "No es un id de Mongo válido").isMongoId(),
    check("id").custom(existeLineaFacturaPorId),
    validarCampos,
  ],
  lineaFacturaGet
);


module.exports = router;