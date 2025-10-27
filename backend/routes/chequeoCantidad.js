const { Router } = require("express");
const { check } = require("express-validator");

const {
  validarCampos,
  validarJWT,
  esAdminRole,
  esOperadorRole,
  esSuperAdminRole,
  tieneRole,
} = require("../middlewares");

const {
  //esRoleValido,
  // emailExiste,
  // existeUsuarioPorId,
  // nitExiste,
  existeContratoPorId,
  existeChequeoCantidadPorId,
} = require("../helpers/db-validators");

const {
  chequeoCantidadGet,
  chequeoCantidadPut,
  chequeoCantidadPost,
  chequeoCantidadDelete,
  chequeoCantidadPatch,
  chequeoCantidadGets,
  chequeoCantidadByRefineria,
} = require("../controllers/chequeoCantidad");

const router = Router();

router.get("/", [validarJWT], chequeoCantidadGets);

// Obtener chequeos de cantidad por refinería
router.get(
  "/refineria/:idRefineria",
  [
    validarJWT,
    check("idRefineria", "No es un ID de Mongo válido").isMongoId(),
    validarCampos,
  ],
  chequeoCantidadByRefineria
);

router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un id de Mongo válido").isMongoId(),
    // check('id').custom( existeChequeoCantidadPorId ),
    validarCampos,
  ],
  chequeoCantidadGet
);
router.put(
  "/:id",
  [
    validarJWT,
    esAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeChequeoCantidadPorId),
    //check("rol").custom(esRoleValido),
    validarCampos,
  ],
  chequeoCantidadPut
);

router.post(
  "/",
  [
    validarJWT,
    esOperadorRole,
    //Validación de campos.
    //check("ubicacion", "La ubicación es obligatorio").not().isEmpty(),
    //check("nombre", "El nombre del chequeoCantidad es obligatorio").not().isEmpty(),
    //check("capacidad", "La capacidad del chequeoCantidad es obligatoria")
    //  .not()
    //.isEmpty(),
    // check("material", "El material del chequeoCantidad es obligatoria").not().isEmpty(),
    // validarCampos,
  ],
  chequeoCantidadPost
);

router.delete(
  "/:id",
  [
    validarJWT,
    esSuperAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeChequeoCantidadPorId),
    validarCampos,
  ],
  chequeoCantidadDelete
);

router.patch("/", chequeoCantidadPatch);

module.exports = router;
