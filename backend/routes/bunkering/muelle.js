const { Router } = require("express");
const { check } = require("express-validator");

const { validarCampos, validarJWT, tieneRole } = require("../../middlewares");

const {
  existeMuellePorId,
  existeBunkeringPorId,
} = require("../../helpers/db-validators");

const {
  muelleGets,
  muelleGet,
  muellePost,
  muellePut,
  muelleDelete,
  muellePatch,
} = require("../../controllers/bunkering/muelle");

const router = Router();

// Obtener todos los muelles
router.get("/", [validarJWT], muelleGets);

// Obtener un muelle por ID
router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeMuellePorId),
    validarCampos,
  ],
  muelleGet
);

// Crear un nuevo muelle
router.post(
  "/",
  [
    validarJWT,
    check("ubicacion", "La ubicación es obligatoria").not().isEmpty(),
    check("nombre", "El nombre del muelle es obligatorio").not().isEmpty(),
    check("nit", "El NIT es obligatorio").not().isEmpty(),
    check("idBunkering", "El ID del bunkering es obligatorio").not().isEmpty(),
    check("idBunkering", "No es un ID válido").isMongoId(),
    check("idBunkering").custom(existeBunkeringPorId),
    validarCampos,
  ],
  muellePost
);

// Actualizar un muelle por ID
router.put(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeMuellePorId),
    validarCampos,
  ],
  muellePut
);

// Eliminar (marcar como eliminado) un muelle por ID
router.delete(
  "/:id",
  [
    validarJWT,
    tieneRole("superAdmin", "admin"),
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeMuellePorId),
    validarCampos,
  ],
  muelleDelete
);

// Actualizar parcialmente un muelle
// router.patch(
//   "/:id",
//   [
//     validarJWT,
//     check("id", "No es un ID válido").isMongoId(),
//     check("id").custom(existeMuellePorId),
//     validarCampos,
//   ],
//   muellePatch
// );

module.exports = router;
