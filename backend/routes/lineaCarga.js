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
  existeLineaPorId,
} = require("../helpers/db-validators");

const {
  lineaCargaGet,
  lineaCargaPut,
  lineaCargaPost,
  lineaCargaDelete,
  lineaCargaPatch,
  lineaCargaGets,
  lineaCargaByRefineria,
} = require("../controllers/lineaCarga");

const router = Router();

router.get("/", [validarJWT], lineaCargaGets);

// Obtener líneas de carga por refinería
router.get(
  "/refineria/:idRefineria",
  [
    validarJWT,
    check("idRefineria", "No es un ID de Mongo válido").isMongoId(),
    validarCampos,
  ],
  lineaCargaByRefineria
);

router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un id de Mongo válido").isMongoId(),
    // check('id').custom( existeProductoPorId ),
    validarCampos,
  ],
  lineaCargaGet
);
router.put(
  "/:id",
  [
    validarJWT,
    esAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeLineaPorId),
    //check("rol").custom(esRoleValido),
    validarCampos,
  ],
  lineaCargaPut
);

router.post(
  "/",
  [
    validarJWT,
    esOperadorRole,
    // check("numero", "El numero es obligatorio").not().isEmpty(),
    //check("nit").custom(nitExiste),
    //check("ubicacion", "La ubicación es obligatorio").not().isEmpty(),
    // check("refineria").custom(existeLineaPorId),

    // check('rol', 'No es un rol válido').isIn(['ADMIN_ROLE','USER_ROLE']),
    // check('rol').custom( esRoleValido ),
    validarCampos,
  ],
  lineaCargaPost
);

router.delete(
  "/:id",
  [
    validarJWT,
    esSuperAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeLineaPorId),
    validarCampos,
  ],
  lineaCargaDelete
);

router.patch("/", lineaCargaPatch);

module.exports = router;
