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
  existePartidaPorId,
} = require("../helpers/db-validators");

const {
  partidaGet,
  partidaPut,
  partidaPost,
  partidaDelete,
  partidaPatch,
  partidaGets,
  partidasByRefineria,
} = require("../controllers/partida");

const router = Router();

router.get("/", partidaGets);

// Obtener partidas por refinería
router.get(
  "/refineria/:idRefineria",
  [
    validarJWT,
    check("idRefineria", "No es un ID de Mongo válido").isMongoId(),
    validarCampos,
  ],
  partidasByRefineria
);

router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un id de Mongo válido").isMongoId(),
    // check('id').custom( existePartidaPorId ),
    validarCampos,
  ],
  partidaGet
);
router.put(
  "/:id",
  [
    validarJWT,
    esAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existePartidaPorId),
    //check("rol").custom(esRoleValido),
    validarCampos,
  ],
  partidaPut
);

router.post(
  "/",
  [
    validarJWT,
    esOperadorRole,
    //Validación de campos.
    //check("ubicacion", "La ubicación es obligatorio").not().isEmpty(),
    //check("nombre", "El nombre delpartida es obligatorio").not().isEmpty(),
    //check("capacidad", "La capacidad delpartida es obligatoria")
    //  .not()
    //.isEmpty(),
    // check("material", "El material delpartida es obligatoria").not().isEmpty(),
    // validarCampos,
  ],
  partidaPost
);

router.delete(
  "/:id",
  [
    validarJWT,
    esSuperAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existePartidaPorId),
    validarCampos,
  ],
  partidaDelete
);

router.patch("/", partidaPatch);

module.exports = router;
