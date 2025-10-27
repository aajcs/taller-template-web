const { Router } = require("express");
const { check } = require("express-validator");

const { validarCampos, validarJWT, tieneRole } = require("../../middlewares");

const {
  existeEmbarcacionPorId,
  existeBunkeringPorId,
} = require("../../helpers/db-validators");

const {
  embarcacionesGets,
  embarcacionGet,
  embarcacionPost,
  embarcacionPut,
  embarcacionDelete,
  embarcacionPatch,
} = require("../../controllers/bunkering/embarcacion");

const router = Router();

// Obtener todas las embarcaciones
router.get("/", [validarJWT], embarcacionesGets);

// Obtener una embarcación por ID
router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeEmbarcacionPorId),
    validarCampos,
  ],
  embarcacionGet
);

// Crear una nueva embarcación
router.post(
  "/",
  [
    validarJWT,
    check("idBunkering", "El ID del bunkering es obligatorio").not().isEmpty(),
    check("idBunkering", "No es un ID válido").isMongoId(),
    check("idBunkering").custom(existeBunkeringPorId),
    check("capacidad", "La capacidad es obligatoria").not().isEmpty(),
    check("capacidad", "La capacidad debe ser un número positivo").isFloat({
      min: 0,
    }),
    check("nombre", "El nombre de la embarcación es obligatorio")
      .not()
      .isEmpty(),
    check("nombre", "El nombre debe tener al menos 3 caracteres").isLength({
      min: 3,
    }),
    check("imo", "El IMO es obligatorio").not().isEmpty(),
    check("imo", "El IMO debe tener al menos 3 caracteres").isLength({
      min: 3,
    }),
    check("tipo", "El tipo de embarcación es obligatorio").not().isEmpty(),
    check(
      "tipo",
      "El tipo debe ser uno de los valores permitidos: Gabarra, Buque, Remolcador"
    ).isIn(["Gabarra", "Buque", "Remolcador"]),
    validarCampos,
  ],
  embarcacionPost
);

// Actualizar una embarcación por ID
router.put(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeEmbarcacionPorId),
    validarCampos,
  ],
  embarcacionPut
);

// Eliminar (marcar como eliminado) una embarcación por ID
router.delete(
  "/:id",
  [
    validarJWT,
    tieneRole("superAdmin", "admin"),
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeEmbarcacionPorId),
    validarCampos,
  ],
  embarcacionDelete
);

// Actualizar parcialmente una embarcación
router.patch(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeEmbarcacionPorId),
    validarCampos,
  ],
  embarcacionPatch
);

module.exports = router;
