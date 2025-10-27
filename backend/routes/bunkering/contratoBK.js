const { Router } = require("express");
const { check } = require("express-validator");
const { existeContratoBKPorId } = require("../../helpers/db-validators");

const {
  validarCampos,
  validarJWT,
  esAdminRole,
  tieneRole,
} = require("../../middlewares");

const {
  contratoBKGet,
  contratoBKPut,
  contratoBKPost,
  contratoBKDelete,
  contratoBKPatch,
  contratoBKGets,
} = require("../../controllers/bunkering/contratoBK");

const router = Router();

router.get("/", [validarJWT], contratoBKGets);
router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un id de Mongo válido").isMongoId(),
    // check('id').custom( existeProductoPorId ),
    validarCampos,
  ],
  contratoBKGet
);
router.put(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeContratoBKPorId),
    //check("rol").custom(esRoleValido),
    validarCampos,
  ],
  contratoBKPut
);

router.post(
  "/",
  [
    validarJWT,
    //Validación de campos.
    //check("ubicacion", "La ubicación es obligatorio").not().isEmpty(),
    //check("nombre", "El nombre del contrato es obligatorio").not().isEmpty(),
    //check("capacidad", "La capacidad del contrato es obligatoria")
    //  .not()
    //.isEmpty(),
    // check("material", "El material del contrato es obligatoria").not().isEmpty(),
    // validarCampos,
  ],
  contratoBKPost
);

router.delete(
  "/:id",
  [
    validarJWT,
    // esAdminRole,
    tieneRole("superAdmin", "admin"),
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeContratoBKPorId),
    validarCampos,
  ],
  contratoBKDelete
);

router.patch("/", contratoBKPatch);

module.exports = router;
