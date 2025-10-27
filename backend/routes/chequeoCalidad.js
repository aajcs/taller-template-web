const { Router } = require("express");
const { check } = require("express-validator");

const {
  validarCampos,
  validarJWT,
  esAdminRole,
  esOperadorRole,
  esSuperAdminRole, 
} = require("../middlewares");

const {
  //esRoleValido,
  // emailExiste,
  // existeUsuarioPorId,
  // nitExiste,
  existeContratoPorId,
  existeChequeoCalidadPorId,
} = require("../helpers/db-validators");

const {
  chequeoCalidadGet,
  chequeoCalidadPut,
  chequeoCalidadPost,
  chequeoCalidadPatch,
  chequeoCalidadDelete,
  chequeoCalidadGets,
  chequeoCalidadsByRefineria,
} = require("../controllers/chequeoCalidad");

const router = Router();

router.get("/", [validarJWT], chequeoCalidadGets);

// Obtener chequeos de calidad por refinería
router.get(
  "/refineria/:idRefineria",
  [
    validarJWT,
    check("idRefineria", "No es un ID de Mongo válido").isMongoId(),
    validarCampos,
  ],
  chequeoCalidadsByRefineria
);

router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un id de Mongo válido").isMongoId(),
    // check('id').custom( existeChequeoCalidadPorId ),
    validarCampos,
  ],
  chequeoCalidadGet
);
router.put(
  "/:id",
  [
    validarJWT,
    esAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeChequeoCalidadPorId),
    //check("rol").custom(esRoleValido),
    validarCampos,
  ],
  chequeoCalidadPut
);

router.post(
  "/",
  [
    validarJWT,
    esOperadorRole, 
    //Validación de campos.
    //check("ubicacion", "La ubicación es obligatorio").not().isEmpty(),
    //check("nombre", "El nombre del chequeoCalidad es obligatorio").not().isEmpty(),
    //check("capacidad", "La capacidad del chequeoCalidad es obligatoria")
    //  .not()
    //.isEmpty(),
    // check("material", "El material del chequeoCalidad es obligatoria").not().isEmpty(),
    // validarCampos,
  ],
  chequeoCalidadPost
);

router.delete(
  "/:id",
  [
    validarJWT,
    esSuperAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeChequeoCalidadPorId),
    validarCampos,
  ],
  chequeoCalidadDelete
);

router.patch("/", chequeoCalidadPatch);

module.exports = router;
