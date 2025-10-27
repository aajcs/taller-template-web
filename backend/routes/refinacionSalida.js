const { Router } = require("express");
const { check } = require("express-validator");

const {
  validarCampos,
  validarJWT,
  esAdminRole,
  tieneRole,
} = require("../middlewares");

const {
  existeRefinacionPorId,
  existeRefinacionSalidaPorId,
} = require("../helpers/db-validators");
// const { existeRefineriaPorId } = require("../helpers/db-validators");
// const { existeTorrePorId } = require("../helpers/db-validators");
// const { existeTanquePorId } = require("../helpers/db-validators");
const {
  refinacionSalidaGet,
  refinacionSalidaPut,
  refinacionSalidaPost,
  refinacionSalidaDelete,
  refinacionSalidaPatch,
  refinacionSalidaGets,
} = require("../controllers/refinacionSalida");

const router = Router();

router.get("/", refinacionSalidaGets);
router.get(
  "/:id",
  [check("id", "No es un id de Mongo válido").isMongoId(), validarCampos],
  refinacionSalidaGet
);
router.put(
  "/:id",
  [
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeRefinacionSalidaPorId),
    // check("idRefineria").custom(existeRefineriaPorId),
    // check("idTanque").custom(existeTanquePorId),
    // check("idTorre").custom(existeTorrePorId),
    //check("rol").custom(esRoleValido), subiendo cambioos
    validarCampos,
  ],
  refinacionSalidaPut
);

router.post(
  "/",
  [
    // // check("idRefineria").custom(existeRefineriaPorId),
    // // check("idTanque").custom(existeTanquePorId),
    // // check("idTorre").custom(existeTorrePorId),
    validarCampos,
  ],
  refinacionSalidaPost
);

router.delete(
  "/:id",
  [
    validarJWT,
    // esAdminRole,
    tieneRole("superAdmin", "admin"),
    check("id", "No es un ID válido").isMongoId(),
    // check("idRefineria").custom(existeRefineriaPorId),
    // check("idTanque").custom(existeTanquePorId),
    // check("idTorre").custom(existeTorrePorId),
    validarCampos,
  ],
  refinacionSalidaDelete
);

router.patch("/", refinacionSalidaPatch);

module.exports = router;
