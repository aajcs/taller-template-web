const { Router } = require("express");
const { check } = require("express-validator");

const {
  validarCampos,
  validarJWT,
  esAdminRole,
  tieneRole,
} = require("../../middlewares");

const {
  //esRoleValido,
  emailExiste,
  existeUsuarioPorId,
  nitExiste,
  existeRefineriaPorId,
} = require("../../helpers/db-validators");
const {
  bunkeringDelete,
  bunkeringPost,
  bunkeringPut,
  bunkeringGet,
  bunkeringGets,
  bunkeringPatch,
} = require("../../controllers/bunkering/bunkering");

const router = Router();

router.get("/", [validarJWT], bunkeringGets);
router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un id de Mongo válido").isMongoId(),
    // check('id').custom( existeProductoPorId ),
    validarCampos,
  ],
  bunkeringGet
);
router.put(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    // check("id").custom(existeRefineriaPorId),
    //check("rol").custom(esRoleValido), subiendo cambioos
    validarCampos,
  ],
  bunkeringPut
);

router.post(
  "/",
  [
    validarJWT,
    check("ubicacion", "La ubicación es obligatorio").not().isEmpty(),
    check("nombre", "El nombre del tanque es obligatorio").not().isEmpty(),
    check("nit", "El NIT es obligatorio").not().isEmpty(),
    check("img", "El logotipo de la refineria es obligatorio").not().isEmpty(),
    validarCampos,
  ],
  bunkeringPost
);

router.delete(
  "/:id",
  [
    validarJWT,
    // esAdminRole,
    tieneRole("superAdmin", "admin"),
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeRefineriaPorId),
    validarCampos,
  ],
  bunkeringDelete
);

router.patch("/", bunkeringPatch);

module.exports = router;
