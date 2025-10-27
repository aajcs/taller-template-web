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
const {
  //esRoleValido,
  // emailExiste,
  // existeUsuarioPorId,
  // nitExiste,
  existeLineaDespachoPorId,
} = require("../helpers/db-validators");

const {
  lineaDespachoGet,
  lineaDespachoPut,
  lineaDespachoPost,
  lineaDespachoDelete,
  lineaDespachoPatch,
  lineaDespachoGets,
  lineaDespachoByRefineria,
} = require("../controllers/lineaDespacho");

const router = Router();

router.get("/", [validarJWT], lineaDespachoGets);

// Obtener líneas de despacho por refinería
router.get(
  "/refineria/:idRefineria",
  [
    validarJWT,
    check("idRefineria", "No es un ID de Mongo válido").isMongoId(),
    validarCampos,
  ],
  lineaDespachoByRefineria
);

router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un id de Mongo válido").isMongoId(),
    // check('id').custom( existeProductoPorId ),
    validarCampos,
  ],
  lineaDespachoGet
);
router.put(
  "/:id",
  [
    validarJWT,
    esAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeLineaDespachoPorId),
    //check("rol").custom(esRoleValido),
    validarCampos,
  ],
  lineaDespachoPut
);

router.post(
  "/",
  [
    validarJWT,
    esOperadorRole,
    // check("numero", "El numero es obligatorio").not().isEmpty(),
    //check("nit").custom(nitExiste),
    //check("ubicacion", "La ubicación es obligatorio").not().isEmpty(),
    // check("refineria").custom(existeLineaDespachoPorId),

    // check('rol', 'No es un rol válido').isIn(['ADMIN_ROLE','USER_ROLE']),
    // check('rol').custom( esRoleValido ),
    validarCampos,
  ],
  lineaDespachoPost
);

router.delete(
  "/:id",
  [
    validarJWT,
    esSuperAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeLineaDespachoPorId),
    validarCampos,
  ],
  lineaDespachoDelete
);

router.patch("/", lineaDespachoPatch);

module.exports = router;
