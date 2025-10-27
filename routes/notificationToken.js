const { Router } = require("express");
const { saveToken } = require("../controllers/notificationToken");
const { validarJWT } = require("../middlewares/validar-jwt");
const { validarCampos } = require("../middlewares/validar-campos");

const router = Router();

// Guardar o actualizar token de notificación push para el usuario
router.post("/", [validarJWT, validarCampos], saveToken);

module.exports = router;
