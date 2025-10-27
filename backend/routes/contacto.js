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
  existeContactoPorId,
} = require("../helpers/db-validators");

const {
  contactoGet,
  contactoPut,
  contactoPost,
  contactoDelete,
  contactoPatch,
  contactoGets,
  contactoByRefineria,
} = require("../controllers/contacto");

const router = Router();

router.get("/", [validarJWT], contactoGets);

// Obtener contactos por refinería
router.get(
  "/refineria/:idRefineria",
  [
    validarJWT,
    check("idRefineria", "No es un ID de Mongo válido").isMongoId(),
    validarCampos,
  ],
  contactoByRefineria
);

router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un id de Mongo válido").isMongoId(),
    validarCampos,
  ],
  contactoGet
);
router.put(
  "/:id",
  [
    validarJWT,
    esAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeContactoPorId),
    //check("rol").custom(esRoleValido),
    validarCampos,
  ],
  contactoPut
);

router.post(
  "/",
  [
    validarJWT,
    esOperadorRole,
    //Validación de campos.
    //check("ubicacion", "La ubicación es obligatorio").not().isEmpty(),
    //check("nombre", "El nombre del contacto es obligatorio").not().isEmpty(),
    //check("capacidad", "La capacidad del contacto es obligatoria")
    //  .not()
    //.isEmpty(),
    // check("material", "El material del contacto es obligatoria").not().isEmpty(),
    // validarCampos,
  ],
  contactoPost
);

router.delete(
  "/:id",
  [
    validarJWT,
   esSuperAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeContactoPorId),
    validarCampos,
  ],
  contactoDelete
);

router.patch("/", contactoPatch);

module.exports = router;
