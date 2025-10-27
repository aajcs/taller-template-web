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
} = require("../helpers/db-validators");

const {
  contratoGet,
  contratoPut,
  contratoPost,
  contratoDelete,
  contratoPatch,
  contratoGets,
  contratoByRefineria,
} = require("../controllers/contrato");

const router = Router();

router.get("/", [validarJWT], contratoGets);

// Obtener contratos por refinería
router.get(
  "/refineria/:idRefineria",
  [
    validarJWT,
    check("idRefineria", "No es un ID de Mongo válido").isMongoId(),
    validarCampos,
  ],
  contratoByRefineria
);

router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un id de Mongo válido").isMongoId(),
    // check('id').custom( existeProductoPorId ),
    validarCampos,
  ],
  contratoGet
);
router.put(
  "/:id",
  [
    validarJWT,
    esAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeContratoPorId),
    //check("rol").custom(esRoleValido),
    validarCampos,
  ],
  contratoPut
);

router.post(
  "/",
  [
    validarJWT,
    esOperadorRole,
    //Validación de campos.
    //check("ubicacion", "La ubicación es obligatorio").not().isEmpty(),
    //check("nombre", "El nombre del contrato es obligatorio").not().isEmpty(),
    //check("capacidad", "La capacidad del contrato es obligatoria")
    //  .not()
    //.isEmpty(),
    // check("material", "El material del contrato es obligatoria").not().isEmpty(),
    // validarCampos,
  ],
  contratoPost
);

router.delete(
  "/:id",
  [
    validarJWT,
    esSuperAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeContratoPorId),
    validarCampos,
  ],
  contratoDelete
);

router.patch("/", contratoPatch);

module.exports = router;
