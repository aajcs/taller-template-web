const { Router } = require("express");
const { check } = require("express-validator");
const {
  despachoGet,
  despachoGets,
  despachoPost,
  despachoPut,
  despachoDelete,
} = require("../controllers/despachoviejo");

const {
  validarCampos,
  validarJWT,
  esAdminRole,
  tieneRole,
} = require("../middlewares");

const { existeDespachoGets } = require("../helpers/db-validators");

const router = Router();

router.get("/", despachoGets);

router.get(
  "/:id",
  [check("id", "No es un id de Mongo válido").isMongoId(), validarCampos],
  despachoGets
);

router.post(
  "/",
  [
    // Agregar validaciones específicas aquí si es necesario
    validarCampos,
  ],
  despachoPost
);

router.put(
  "/:id",
  [
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeDespachoGets),
    validarCampos,
  ],
  despachoPut
);

router.delete(
  "/:id",
  [
    validarJWT,
    tieneRole("superAdmin", "admin"),
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeDespachoGets),
    validarCampos,
  ],
  despachoDelete
);

module.exports = router;
