const { Router } = require("express");
const { check } = require("express-validator");

const {
  validarCampos,
  validarJWT,
  esSuperAdminRole,
  tieneRole,
} = require("../middlewares");
const {
  //esRoleValido,
  emailExiste,
  existeUsuarioPorId,
  nitExiste,
  existeRefineriaPorId,
} = require("../helpers/db-validators");

const {
  refineriasGet,
  refineriasPut,
  refineriasPost,
  refineriasDelete,
  refineriasPatch,
  refineriasGets,
} = require("../controllers/refinerias");

const router = Router();

router.get("/", [validarJWT], refineriasGets);
router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un id de Mongo válido").isMongoId(),
    // check('id').custom( existeProductoPorId ),
    validarCampos,
  ],
  refineriasGet
);
router.put(
  "/:id",
  [
    validarJWT,
    esSuperAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeRefineriaPorId),
    //check("rol").custom(esRoleValido), subiendo cambioos
    validarCampos,
  ],
  refineriasPut
);

router.post(
  "/",
  [
    validarJWT,
    esSuperAdminRole,
    check("ubicacion", "La ubicación es obligatorio").not().isEmpty(),
    check("nombre", "El nombre del tanque es obligatorio").not().isEmpty(),
    check("nit", "El NIT es obligatorio").not().isEmpty(),
    check("img", "El logotipo de la refineria es obligatorio").not().isEmpty(),
    validarCampos,
  ],
  refineriasPost
);

router.delete(
  "/:id",
  [
    validarJWT,
    esSuperAdminRole,
    // esAdminRole,
    tieneRole("superAdmin", "admin"),
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeRefineriaPorId),
    validarCampos,
  ],
  refineriasDelete
);

router.patch("/", refineriasPatch);

module.exports = router;
