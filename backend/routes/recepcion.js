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
  existeRecepcionPorId,
} = require("../helpers/db-validators");

const {
  recepcionGet,
  recepcionPut,
  recepcionPost,
  recepcionDelete,
  recepcionPatch,
  recepcionGets,
  recepcionAgruparPorStatus,
  recepcionPorRangoFechas,
  recepcionByRefineria,
} = require("../controllers/recepcion");

const router = Router();

router.get("/agrupar-status", recepcionAgruparPorStatus);
// Recibe los parámetros de fecha por query string, por ejemplo: /rango-fechas?fechaInicio=2024-01-01&fechaFin=2024-01-31
router.get("/rango-fechas", recepcionPorRangoFechas);

router.get("/", [validarJWT], recepcionGets);

// Obtener recepciones por refinería
router.get(
  "/refineria/:idRefineria",
  [
    validarJWT,
    check("idRefineria", "No es un ID de Mongo válido").isMongoId(),
    validarCampos,
  ],
  recepcionByRefineria
);

router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un id de Mongo válido").isMongoId(),
    validarCampos,
  ],
  recepcionGet
);
router.put(
  "/:id",
  [
    validarJWT,
    esOperadorRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeRecepcionPorId),
    //check("rol").custom(esRoleValido), subiendo cambioos
    validarCampos,
    
  ],
  recepcionPut
);

router.post(
  "/",
  [
    validarJWT,
    esOperadorRole,
    // check("ubicacion", "La ubicación es obligatorio").not().isEmpty(),
    // check("nombre", "El nombre del tanque es obligatorio").not().isEmpty(),
    // check("nit", "El NIT es obligatorio").not().isEmpty(),
    // check("img", "El logotipo de la refineria es obligatorio").not().isEmpty(),
    validarCampos,
  ],
  recepcionPost
);

router.delete(
  "/:id",
  [
    validarJWT,
    esSuperAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeRecepcionPorId),
    validarCampos,
  ],
  recepcionDelete
);

router.patch("/", recepcionPatch);

module.exports = router;
