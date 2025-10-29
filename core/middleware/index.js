/**
 * Core Middleware Index
 * Exporta todos los middlewares reutilizables de la aplicación
 */

module.exports = {
  tenantResolver: require("./tenantResolver"),
  validarJWT: require("../../middlewares/validar-jwt"),
  validarCampos: require("../../middlewares/validar-campos"),
  validarRoles: require("../../middlewares/validar-roles"),
  validarArchivo: require("../../middlewares/validar-archivo"),
  errorHandler: require("../../middlewares/error-handler"),
};
