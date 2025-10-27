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
  existeAbonoPorId,
} = require("../helpers/db-validators");

const {
  abonoGet,
  abonoPut,
  abonoPost,
  abonoDelete,
  abonoPatch,
  abonoGets,
  sumarAbonosPorTipoYFecha,
  abonosByRefineria,
} = require("../controllers/abono");

const router = Router();

router.get("/sumar", sumarAbonosPorTipoYFecha); // <-- agrega la ruta

// Obtener abonos por refinería
router.get(
  "/refineria/:idRefineria",
  [
    validarJWT,
    check("idRefineria", "No es un ID de Mongo válido").isMongoId(),
    validarCampos,
  ],
  abonosByRefineria
);

router.get("/", [validarJWT], abonoGets);
router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un id de Mongo válido").isMongoId(),
    // check('id').custom( existeProductoPorId ),
    validarCampos,
  ],
  abonoGet
);
router.put(
  "/:id",
  [
    validarJWT,
    esAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeAbonoPorId),
    //check("rol").custom(esRoleValido),
    validarCampos,
  ],
  abonoPut
);

router.post(
  "/",
  [
    validarJWT,
    esOperadorRole,
    //Validación de campos.
    //check("ubicacion", "La ubicación es obligatorio").not().isEmpty(),
    //check("nombre", "El nombre del abono es obligatorio").not().isEmpty(),
    //check("capacidad", "La capacidad del abono es obligatoria")
    //  .not()
    //.isEmpty(),
    // check("material", "El material del abono es obligatoria").not().isEmpty(),
    // validarCampos,
  ],
  abonoPost
);

router.delete(
  "/:id",
  [
    validarJWT,
    esSuperAdminRole, 
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeAbonoPorId),
    validarCampos,
  ],
  abonoDelete
);

router.patch("/", abonoPatch);

module.exports = router;
