const { Router } = require("express");
const { check } = require("express-validator");
const {
  chequeoCantidadBKGets,
  chequeoCantidadBKGet,
  chequeoCantidadBKPost,
  chequeoCantidadBKPut,
  chequeoCantidadBKDelete,
  chequeoCantidadBKPatch,
} = require("../../controllers/bunkering/chequeoCantidadBK");
const { validarCampos, validarJWT, esAdminRole,
  tieneRole, } = require("../../middlewares");

const router = Router();

// Obtener todos los chequeos de cantidad
router.get("/", [validarJWT], chequeoCantidadBKGets);

// Obtener un chequeo de cantidad por ID
router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    validarCampos,
  ],
  chequeoCantidadBKGet
);

// Crear un nuevo chequeo de cantidad
router.post(
  "/",
  [
    validarJWT,
    check("idBunkering", "El ID de bunkering es obligatorio").not().isEmpty(),
    check("idProducto", "El ID de producto es obligatorio").not().isEmpty(),
    check("aplicar.tipo", "El tipo de aplicación es obligatorio").not().isEmpty(),
    check("aplicar.idReferencia", "El ID de referencia es obligatorio").not().isEmpty(),
    check("fechaChequeo", "La fecha del chequeo es obligatoria").not().isEmpty(),
    check("cantidad", "La cantidad es obligatoria").not().isEmpty(),
    validarCampos,
  ],
  chequeoCantidadBKPost
);

// Actualizar un chequeo de cantidad por ID
router.put(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    validarCampos,
  ],
  chequeoCantidadBKPut
);

// Eliminar (marcar como eliminado) un chequeo de cantidad por ID
router.delete(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    validarCampos,
  ],
  chequeoCantidadBKDelete
);

// Patch (opcional)
router.patch(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    validarCampos,
  ],
  chequeoCantidadBKPatch
);

module.exports = router;