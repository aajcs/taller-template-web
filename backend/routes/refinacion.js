const { Router } = require("express");
const { check } = require("express-validator");

const {
  validarCampos,
  validarJWT,
  esAdminRole,
  tieneRole,
  esSuperAdminRole,
} = require("../middlewares");

const { existeRefinacionPorId } = require("../helpers/db-validators");
// const { existeRefineriaPorId } = require("../helpers/db-validators");
// const { existeTorrePorId } = require("../helpers/db-validators");
// const { existeTanquePorId } = require("../helpers/db-validators");
const {
  refinacionGet,
  refinacionPut,
  refinacionPost,
  refinacionDelete,
  refinacionPatch,
  refinacionGets,
} = require("../controllers/refinacion");

const router = Router();

router.get("/", refinacionGets);
router.get(
  "/:id",
  [check("id", "No es un id de Mongo válido").isMongoId(), validarCampos],
  refinacionGet
);
router.put(
  "/:id",
  [
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeRefinacionPorId),
    // check("idRefineria").custom(existeRefineriaPorId),
    // check("idTanque").custom(existeTanquePorId),
    // check("idTorre").custom(existeTorrePorId),
    //check("rol").custom(esRoleValido), subiendo cambioos
    validarCampos,
  ],
  refinacionPut
);

router.post(
  "/",
  [
    // // check("idRefineria").custom(existeRefineriaPorId),
    // // check("idTanque").custom(existeTanquePorId),
    // // check("idTorre").custom(existeTorrePorId),
    validarCampos,
  ],
  refinacionPost
);

router.delete(
  "/:id",
  [
    validarJWT,
    esSuperAdminRole,
    tieneRole("superAdmin", "admin"),
    check("id", "No es un ID válido").isMongoId(),
    // check("idRefineria").custom(existeRefineriaPorId),
    // check("idTanque").custom(existeTanquePorId),
    // check("idTorre").custom(existeTorrePorId),
    validarCampos,
  ],
  refinacionDelete
);

router.patch("/", refinacionPatch);

module.exports = router;
