const { Router } = require("express");
const { check } = require("express-validator");

const {
  validarCampos,
  validarJWT,
  esAdminRole,
  tieneRole,
} = require("../middlewares");

const {
  //esRoleValido,
  // emailExiste,
  // existeUsuarioPorId,
  // nitExiste,
  existeBombaPorId,
} = require("../helpers/db-validators");

const {
  bombaGet,
  bombaPut,
  bombaPost,
  bombaDelete,
  bombaPatch,
  bombaGets,
} = require("../controllers/bomba");

const router = Router();

router.get("/", bombaGets);
router.get(
  "/:id",
  [
    check("id", "No es un id de Mongo válido").isMongoId(),
    // check('id').custom( existeProductoPorId ),
    validarCampos,
  ],
  bombaGet
);
router.put(
  "/:id",
  [
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeBombaPorId),
    //check("rol").custom(esRoleValido),
    validarCampos,
  ],
  bombaPut
);

router.post(
  "/",
  [
    //check("numero", "El numero es obligatorio").not().isEmpty(),
    //check("nit").custom(nitExiste),
    check("ubicacion", "La ubicación es obligatorio").not().isEmpty(),
    // check("refineria").custom(existeBombaPorId),

    // check('rol', 'No es un rol válido').isIn(['ADMIN_ROLE','USER_ROLE']),
    // check('rol').custom( esRoleValido ),
    validarCampos,
  ],
  bombaPost
);

router.delete(
  "/:id",
  [
    validarJWT,
    // esAdminRole,
    tieneRole("superAdmin", "admin"),
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeBombaPorId),
    validarCampos,
  ],
  bombaDelete
);

router.patch("/", bombaPatch);

module.exports = router;
