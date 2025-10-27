const { response } = require("express");

const ROLES = [
  "lectura",
  "user",
  "operador",
  "admin",
  "superAdmin",
];

const checkRole = (requiredRole) => {
  return (req, res = response, next) => {
    if (!req.usuario) {
      return res.status(500).json({
        msg: "Se quiere verificar el role sin validar el token primero",
      });
    }

    const { rol, nombre } = req.usuario;
    const userRoleIndex = ROLES.indexOf(rol);
    const requiredRoleIndex = ROLES.indexOf(requiredRole);

    if (userRoleIndex === -1) {
      return res.status(403).json({
        msg: `${nombre} tiene un rol no válido`,
      });
    }

    // Permite acceso si el rol del usuario es igual o superior al requerido
    if (userRoleIndex < requiredRoleIndex) {
      return res.status(403).json({
        message:  `El rol (${rol}) no es permitido`,        
        errors: [`${nombre} no tiene permisos suficientes - Se requiere al menos ${requiredRole}`],
      });
    }

    next();
  };
};

const esSuperAdminRole = checkRole("superAdmin");
const esAdminRole = checkRole("admin");
const esOperadorRole = checkRole("operador");
const esUserRole = checkRole("user");
const esLecturaRole = checkRole("lectura");

const tieneRole = (...roles) => {
  return (req, res = response, next) => {
    if (!req.usuario) {
      return res.status(500).json({
        msg: "Se quiere verificar el role sin validar el token primero",
      });
    }

    if (!roles.includes(req.usuario.rol)) {
      return res.status(401).json({
        msg: `El servicio requiere uno de estos roles ${roles}`,
      });
    }

    next();
  };
};

module.exports = {
  esSuperAdminRole,
  esAdminRole,
  esOperadorRole,
  esUserRole,
  esLecturaRole,
  tieneRole,
};
