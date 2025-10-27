const { Router } = require("express");
const { check } = require("express-validator");

const {
  validarCampos,
  validarJWT,
  esSuperAdminRole,
  tieneRole,
} = require("../middlewares");

const {
  //esRoleValido,
  // emailExiste,
  // existeUsuarioPorId,
  // nitExiste,
  existeTorrePorId,
} = require("../helpers/db-validators");

const {
  torreGet,
  torrePut,
  torrePost,
  torreDelete,
  torrePatch,
  torreGets,
  torreByRefineria,
} = require("../controllers/torre");

const router = Router();

router.get("/", [validarJWT], torreGets);

// Obtener torres por refinería
router.get(
  "/refineria/:idRefineria",
  [
    validarJWT,
    check("idRefineria", "No es un ID de Mongo válido").isMongoId(),
    validarCampos,
  ],
  torreByRefineria
);

// Obtener una torre específica por ID
router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un id de Mongo válido").isMongoId(),
    // check('id').custom( existeProductoPorId ),
    validarCampos,
  ],
  torreGet
);
router.put(
  "/:id",
  [
    validarJWT,
    esSuperAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeTorrePorId),
    //check("rol").custom(esRoleValido),
    validarCampos,
  ],
  torrePut
);

router.post(
  "/",
  [
    validarJWT,
    esSuperAdminRole,
    //check("numero", "El numero es obligatorio").not().isEmpty(),
    //check("nit").custom(nitExiste),
    // check("ubicacion", "La ubicación es obligatorio").not().isEmpty(),
    // check("refineria").custom(existeTorrePorId),

    // check('rol', 'No es un rol válido').isIn(['ADMIN_ROLE','USER_ROLE']),
    // check('rol').custom( esRoleValido ),
    validarCampos,
  ],
  torrePost
);

router.delete(
  "/:id",
  [
    validarJWT,
    esSuperAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeTorrePorId),
    validarCampos,
  ],
  torreDelete
);

router.patch("/", torrePatch);

module.exports = router;
