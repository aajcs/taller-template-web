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
  existeTipoProductoPorId,
} = require("../helpers/db-validators");

const {
  tipoProductoGet,
  tipoProductoPut,
  tipoProductoPost,
  tipoProductoDelete,
  tipoProductoPatch,
  tipoProductoGets,
  tipoProductoByRefineria,
} = require("../controllers/tipoProducto");

const router = Router();

router.get("/", [validarJWT], tipoProductoGets);

// Obtener tipos de producto por refinería
router.get(
  "/refineria/:idRefineria",
  [
    validarJWT,
    check("idRefineria", "No es un ID de Mongo válido").isMongoId(),
    validarCampos,
  ],
  tipoProductoByRefineria
);

router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un id de Mongo válido").isMongoId(),
    // check('id').custom( existeTipoProductoPorId ),
    validarCampos,
  ],
  tipoProductoGet
);
router.put(
  "/:id",
  [
    validarJWT,
    esAdminRole,  
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeTipoProductoPorId),
    //check("rol").custom(esRoleValido),
    validarCampos,
  ],
  tipoProductoPut
);

router.post(
  "/",
  [
    validarJWT,
    esOperadorRole,
    //Validación de campos.
    //check("ubicacion", "La ubicación es obligatorio").not().isEmpty(),
    //check("nombre", "El nombre del tipoProducto es obligatorio").not().isEmpty(),
    //check("capacidad", "La capacidad del tipoProducto es obligatoria")
    //  .not()
    //.isEmpty(),
    // check("material", "El material del tipoProducto es obligatoria").not().isEmpty(),
    // validarCampos,
  ],
  tipoProductoPost
);

router.delete(
  "/:id",
  [
    validarJWT,
    esSuperAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeTipoProductoPorId),
    validarCampos,
  ],
  tipoProductoDelete
);

router.patch("/", tipoProductoPatch);

module.exports = router;
