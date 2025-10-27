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
  existeFacturaPorId,
} = require("../helpers/db-validators");

const {
  facturaGet,
  facturaPut,
  facturaPost,
  facturaDelete,
  facturaPatch,
  facturaGets,
  facturasByRefineria,
} = require("../controllers/factura");

const router = Router();

router.get(
  "/",
  validarJWT,

  facturaGets
);
router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un id de Mongo válido").isMongoId(),
    // check('id').custom( existeFacturaPorId ),
    validarCampos,
  ],
  facturaGet
);
router.put(
  "/:id",
  [
    validarJWT,
    esAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeFacturaPorId),
    //check("rol").custom(esRoleValido),
    validarCampos,
  ],
  facturaPut
);

router.post(
  "/",
  [
    validarJWT,
    esOperadorRole, 
    //Validación de campos.
    //check("ubicacion", "La ubicación es obligatorio").not().isEmpty(),
    //check("nombre", "El nombre delfactura es obligatorio").not().isEmpty(),
    //check("capacidad", "La capacidad delfactura es obligatoria")
    //  .not()
    //.isEmpty(),
    // check("material", "El material delfactura es obligatoria").not().isEmpty(),
    // validarCampos,
  ],
  facturaPost
);

router.delete(
  "/:id",
  [
    validarJWT,
    esSuperAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeFacturaPorId),
    validarCampos,
  ],
  facturaDelete
);

router.patch("/", facturaPatch);

// Ruta para obtener facturas por refinería
router.get("/refineria/:idRefineria", facturasByRefineria);

module.exports = router;
