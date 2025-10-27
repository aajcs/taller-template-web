const { Router } = require("express");
const { check } = require("express-validator");
const {
  chequeoCalidadBKGets,
  chequeoCalidadBKGet,
  chequeoCalidadBKPost,
  chequeoCalidadBKPut,
  chequeoCalidadBKDelete,
  chequeoCalidadBKPatch,
} = require("../../controllers/bunkering/chequeoCalidadBK");
const { validarCampos, validarJWT, esAdminRole,
  tieneRole, } = require("../../middlewares");

const router = Router();

// Obtener todos los chequeos de calidad
router.get("/", [validarJWT], chequeoCalidadBKGets);

// Obtener un chequeo de calidad por ID
router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    validarCampos,
  ],
  chequeoCalidadBKGet
);

// Crear un nuevo chequeo de calidad
router.post(
  "/",
  [
    validarJWT,
    check("idBunkering", "El ID de bunkering es obligatorio").not().isEmpty(),
    check("idProducto", "El ID de producto es obligatorio").not().isEmpty(),
    check("fechaChequeo", "La fecha del chequeo es obligatoria").not().isEmpty(),
    validarCampos,
  ],
  chequeoCalidadBKPost
);

// Actualizar un chequeo de calidad por ID
router.put(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    validarCampos,
  ],
  chequeoCalidadBKPut
);

// Eliminar (marcar como eliminado) un chequeo de calidad por ID
router.delete(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    validarCampos,
  ],
  chequeoCalidadBKDelete
);

module.exports = router;