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

const { existeCostoPorId } = require("../helpers/db-validators");
// const { existeRefineriaPorId } = require("../helpers/db-validators");
// const { existeTorrePorId } = require("../helpers/db-validators");
// const { existeTanquePorId } = require("../helpers/db-validators");
const {
  costoGet,
  costoPut,
  costoPost,
  costoDelete,
  costoPatch,
  costoGets,
} = require("../controllers/costo");

const router = Router();

router.get("/", [validarJWT], costoGets);
router.get(
  "/:id",
  [ validarJWT,
    check("id", "No es un id de Mongo válido").isMongoId(), 
    validarCampos
],
  costoGet
);
router.put(
  "/:id",
  [ validarJWT,
    esAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeCostoPorId),
    // check("idRefineria").custom(existeRefineriaPorId),
    // check("idTanque").custom(existeTanquePorId),
    // check("idTorre").custom(existeTorrePorId),
    //check("rol").custom(esRoleValido), subiendo cambioos
    validarCampos,
  ],
  costoPut
);

router.post(
  "/",
  [ validarJWT,
    esOperadorRole,
    // // check("idRefineria").custom(existeRefineriaPorId),
    // // check("idTanque").custom(existeTanquePorId),
    // // check("idTorre").custom(existeTorrePorId),
    validarCampos,
  ],
  costoPost
);

router.delete(
  "/:id",
  [
    validarJWT,
    esSuperAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    // check("idRefineria").custom(existeRefineriaPorId),
    // check("idTanque").custom(existeTanquePorId),
    // check("idTorre").custom(existeTorrePorId),
    validarCampos,
  ],
  costoDelete
);

router.patch("/", costoPatch);

module.exports = router;
