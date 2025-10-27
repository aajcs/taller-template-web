const { Router } = require("express");
const { check } = require("express-validator");

const { validarCampos, validarJWT } = require("../middlewares");

const {
  login,
  googleSignin,
  validarTokenUsuario,
  register,
} = require("../controllers/auth");

const router = Router();

router.post(
  "/login",
  [
    check("correo", "El correo es obligatorio").isEmail(),
    check("password", "La contraseña es obligatoria").not().isEmpty(),
    validarCampos,
  ],
  login
);
router.post(
  "/register",
  [
    check("nombre", "El nombre es obligatorio").not().isEmpty(),
    check("correo", "El correo es obligatorio").isEmail(),
    check("password", "La contraseña es obligatoria").not().isEmpty(),
    check("telefono", "El teléfono es obligatorio").not().isEmpty(),
    validarCampos,
  ],
  register
);

router.post(
  "/google",
  [
    check("id_token", "El id_token es necesario").not().isEmpty(),
    validarCampos,
  ],
  googleSignin
);

router.get("/", [validarJWT], validarTokenUsuario);

module.exports = router;
