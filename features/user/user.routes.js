const { Router } = require("express");
const { check } = require("express-validator");

const {
  validarCampos,
  validarJWT,
  esSuperAdminRole,
  tieneRole,
} = require("../../middlewares");

const {
  esRoleValido,
  emailExiste,
  existeUsuarioPorId,
} = require("../../helpers/db-validators");

const {
  userGetById,
  userPut,
  userPost,
  userDelete,
  userPatch,
  usersGet,
} = require("./user.controllers");

const router = Router();

router.get("/", [validarJWT], usersGet);
router.get(
  "/:id",
  [
    // validarJWT,
    check("id", "No es un id de Mongo válido").isMongoId(),
    // check('id').custom( existeProductoPorId ),
    validarCampos,
  ],
  userGetById
);
router.put(
  "/:id",
  [
    validarJWT,
    esSuperAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeUsuarioPorId),
    //check("rol").custom(esRoleValido),
    validarCampos,
  ],
  userPut
);

router.post(
  "/",
  [
    validarJWT,
    esSuperAdminRole,
    check("nombre", "El nombre es obligatorio").not().isEmpty(),
    check("password", "El password debe de ser más de 6 letras").isLength({
      min: 6,
    }),
    check("correo", "El correo no es válido").isEmail(),
    check("correo").custom(emailExiste),
    // check('rol', 'No es un rol válido').isIn(['ADMIN_ROLE','USER_ROLE']),
    // check('rol').custom( esRoleValido ),
    validarCampos,
  ],
  userPost
);

router.delete(
  "/:id",
  [
    validarJWT,
    esSuperAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeUsuarioPorId),
    validarCampos,
  ],
  userDelete
);

router.patch("/", userPatch);

module.exports = router;
