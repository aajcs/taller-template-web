const { Router } = require("express");
const { check } = require("express-validator");

const {
  validarCampos,
  validarJWT,
  esAdminRole,
  esOperadorRole,
  esSuperAdminRole,  tieneRole,
} = require("../middlewares");

const {
  //esRoleValido,
  // emailExiste,
  // existeUsuarioPorId,
  // nitExiste,
  existeDespachoPorId,
} = require("../helpers/db-validators");

const {
  despachoGet,
  despachoPut,
  despachoPost,
  despachoDelete,
  despachoPatch,
  despachoGets,
  despachoByRefineria,
} = require("../controllers/despacho");

const router = Router();

router.get("/", [validarJWT], despachoGets);

// Obtener despachos por refinería
router.get(
  "/refineria/:idRefineria",
  [
    validarJWT,
    check("idRefineria", "No es un ID de Mongo válido").isMongoId(),
    validarCampos,
  ],
  despachoByRefineria
);

router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un id de Mongo válido").isMongoId(),
    // check('id').custom( existeProductoPorId ),
    validarCampos,
  ],
  despachoGet
);
router.put(
  "/:id",
  [
    validarJWT,
    esOperadorRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeDespachoPorId),
    //check("rol").custom(esRoleValido), subiendo cambioos
    validarCampos,
  ],
  despachoPut
);

router.post(
  "/",
  [
    validarJWT,
    esOperadorRole,
    // check("ubicacion", "La ubicación es obligatorio").not().isEmpty(),
    // check("nombre", "El nombre del tanque es obligatorio").not().isEmpty(),
    // check("nit", "El NIT es obligatorio").not().isEmpty(),
    // check("img", "El logotipo de la refineria es obligatorio").not().isEmpty(),
    validarCampos,
  ],
  despachoPost
);

router.delete(
  "/:id",
  [
    validarJWT,
    esSuperAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeDespachoPorId),
    validarCampos,
  ],
  despachoDelete
);

router.patch("/", despachoPatch);

module.exports = router;
