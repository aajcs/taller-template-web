const { Router } = require("express");
const { check } = require("express-validator");

const {
  validarCampos,
  validarJWT,
  esAdminRole,
  tieneRole,
} = require("../middlewares");

const {
  //esRoleValido,
  // emailExiste,
  // existeUsuarioPorId,
  // nitExiste,
  existeContratoPorId,
  existeHistorialPorId,
} = require("../helpers/db-validators");

const {
  historialGet,
  historialPut,
  historialPost,
  historialDelete,
  historialPatch,
  historialGets,
} = require("../controllers/historial");

const router = Router();

router.get("/", historialGets);
router.get(
  "/:id",
  [
    check("id", "No es un id de Mongo válido").isMongoId(),
    // check('id').custom( existeHistorialPorId ),
    validarCampos,
  ],
  historialGet
);
router.put(
  "/:id",
  [
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeHistorialPorId),
    //check("rol").custom(esRoleValido),
    validarCampos,
  ],
  historialPut
);

router.post(
  "/",
  [
    //Validación de campos.
    //check("ubicacion", "La ubicación es obligatorio").not().isEmpty(),
    //check("nombre", "El nombre delhistorial es obligatorio").not().isEmpty(),
    //check("capacidad", "La capacidad delhistorial es obligatoria")
    //  .not()
    //.isEmpty(),
    // check("material", "El material delhistorial es obligatoria").not().isEmpty(),
    // validarCampos,
  ],
  historialPost
);

router.delete(
  "/:id",
  [
    validarJWT,
    // esAdminRole,
    tieneRole("superAdmin", "admin"),
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeHistorialPorId),
    validarCampos,
  ],
  historialDelete
);

router.patch("/", historialPatch);

module.exports = router;
