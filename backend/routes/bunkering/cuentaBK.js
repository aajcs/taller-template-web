const { Router } = require("express");
const { check } = require("express-validator");

const { validarCampos, validarJWT, tieneRole } = require("../../middlewares");

const { existeContratoBKPorId } = require("../../helpers/db-validators");

const {
  cuentasBKGets,
  cuentaBKGet,
  cuentaBKPostFromContrato,
  cuentaBKPut,
  cuentaBKDelete,
  cuentaBKSycnFromContrato,
} = require("../../controllers/bunkering/cuentaBK");

const router = Router();

// Obtener todas las cuentasBK
router.get("/", [validarJWT], cuentasBKGets);

// Obtener una cuentaBK específica por ID
router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID de Mongo válido").isMongoId(),
    validarCampos,
  ],
  cuentaBKGet
);

// Crear una nueva cuentaBK desde un contrato
router.post(
  "/from-contrato",
  [
    validarJWT,
    check("idContrato", "El ID del contrato es obligatorio").not().isEmpty(),
    check("idContrato", "No es un ID de Mongo válido").isMongoId(),
    check("idContrato").custom(existeContratoBKPorId),
    validarCampos,
  ],
  cuentaBKPostFromContrato
);

// Actualizar una cuentaBK por ID
router.put(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    check(
      "tipoCuentaBK",
      "El tipo de cuenta debe ser 'CuentaBKs por Cobrar' o 'CuentaBKs por Pagar'"
    )
      .optional()
      .isIn(["CuentaBKs por Cobrar", "CuentaBKs por Pagar"]),
    check("montoTotalContrato", "El monto total debe ser un número positivo")
      .optional()
      .isFloat({ min: 0 }),
    validarCampos,
  ],
  cuentaBKPut
);

// Eliminar una cuentaBK por ID
router.delete(
  "/:id",
  [
    validarJWT,
    tieneRole("superAdmin", "admin"), // Solo roles específicos pueden eliminar
    check("id", "No es un ID válido").isMongoId(),
    validarCampos,
  ],
  cuentaBKDelete
);

// Sincronizar una cuentaBK desde un contrato
router.post(
  "/sync/:contratoId",
  [
    validarJWT,
    check("contratoId", "No es un ID de Mongo válido").isMongoId(),
    check("contratoId").custom(existeContratoBKPorId),
    validarCampos,
  ],
  cuentaBKSycnFromContrato
);

module.exports = router;
