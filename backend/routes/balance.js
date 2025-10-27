const { Router } = require("express");
const { check } = require("express-validator");

const {
  validarCampos,
  validarJWT,
  esAdminRole,
  esOperadorRole,
  esSuperAdminRole,
  tieneRole,
} = require("../middlewares");

const { existeBalancePorId } = require("../helpers/db-validators");

const {
  balanceGet,
  balancePut,
  balancePost,
  balanceDelete,
  balancePatch,
  balanceGets,
  balancesByRefineria,
} = require("../controllers/balance");

const router = Router();

router.get("/", [validarJWT], balanceGets);

// Obtener balances por refinería
router.get(
  "/refineria/:idRefineria",
  [
    validarJWT,
    check("idRefineria", "No es un id de Mongo válido").isMongoId(),
    validarCampos,
  ],
  balancesByRefineria
);
router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un id de Mongo válido").isMongoId(),
    validarCampos,
  ],
  balanceGet
);
router.put(
  "/:id",
  [
    validarJWT,
    esSuperAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeBalancePorId),
    validarCampos,
  ],
  balancePut
);

router.post("/", [validarJWT, validarCampos], balancePost);

router.delete(
  "/:id",
  [
    validarJWT,
    esSuperAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeBalancePorId),
    validarCampos,
  ],
  balanceDelete
);

router.patch("/", [validarJWT], balancePatch);

module.exports = router;
