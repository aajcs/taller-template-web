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
  existeProductoPorId,
} = require("../helpers/db-validators");

const {
  productoGet,
  productoPut,
  productoPost,
  productoDelete,
  productoPatch,
  productoGets,
  productoByRefineria,
} = require("../controllers/producto");

const router = Router();

router.get("/", [validarJWT], productoGets);

// Obtener productos por refinería
router.get(
  "/refineria/:idRefineria",
  [
    validarJWT,
    check("idRefineria", "No es un ID de Mongo válido").isMongoId(),
    validarCampos,
  ],
  productoByRefineria
);

router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un id de Mongo válido").isMongoId(),
    // check('id').custom( existeProductoPorId ),
    validarCampos,
  ],
  productoGet
);
router.put(
  "/:id",
  [
    validarJWT,
    esAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeProductoPorId),
    //check("rol").custom(esRoleValido),
    validarCampos,
  ],
  productoPut
);

router.post(
  "/",
  [
    validarJWT,
    esOperadorRole,
    //Validación de campos.
    //check("ubicacion", "La ubicación es obligatorio").not().isEmpty(),
    //check("nombre", "El nombre del producto es obligatorio").not().isEmpty(),
    //check("capacidad", "La capacidad del producto es obligatoria")
    //  .not()
    //.isEmpty(),
    // check("material", "El material del producto es obligatoria").not().isEmpty(),
    // validarCampos,
  ],
  productoPost
);

router.delete(
  "/:id",
  [
    validarJWT,
    esSuperAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeProductoPorId),
    validarCampos,
  ],
  productoDelete
);

router.patch("/", productoPatch);

module.exports = router;
