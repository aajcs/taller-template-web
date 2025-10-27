const { Router } = require("express");
const { check } = require("express-validator");

const { validarCampos, validarJWT, tieneRole } = require("../../middlewares");

const { existeContactoBKPorId } = require("../../helpers/db-validators");

const {
  contactoGet,
  contactoPut,
  contactoPost,
  contactoDelete,
  contactoGets,
} = require("../../controllers/bunkering/contactoBK");

const router = Router();

// Obtener todos los contactos
router.get("/", [validarJWT], contactoGets);

// Obtener un contacto específico por ID
router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido de MongoDB").isMongoId(),
    check("id").custom(existeContactoBKPorId), // Valida que el contacto exista
    validarCampos,
  ],
  contactoGet
);

// Crear un nuevo contacto
router.post(
  "/",
  [
    validarJWT,
    check("nombre", "El nombre debe tener al menos 3 caracteres")
      .optional()
      .isLength({ min: 3 }),
    check("correo", "El correo no es válido").optional().isEmail(),
    check("email", "El email no es válido").optional().isEmail(),
    check("telefono", "El teléfono debe tener al menos 7 caracteres")
      .optional()
      .isLength({ min: 7 }),
    check("tipo", "El tipo debe ser 'Cliente' o 'Proveedor'")
      .optional()
      .isIn(["Cliente", "Proveedor"]),
    validarCampos,
  ],
  contactoPost
);

// Actualizar un contacto por ID
router.put(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido de MongoDB").isMongoId(),
    check("id").custom(existeContactoBKPorId), // Valida que el contacto exista
    check("nombre", "El nombre debe tener al menos 3 caracteres")
      .optional()
      .isLength({ min: 3 }),
    check("correo", "El correo no es válido").optional().isEmail(),
    check("email", "El email no es válido").optional().isEmail(),
    check("telefono", "El teléfono debe tener al menos 7 caracteres")
      .optional()
      .isLength({ min: 7 }),
    check("tipo", "El tipo debe ser 'Cliente' o 'Proveedor'")
      .optional()
      .isIn(["Cliente", "Proveedor"]),
    validarCampos,
  ],
  contactoPut
);

// Eliminar (marcar como eliminado) un contacto por ID
router.delete(
  "/:id",
  [
    validarJWT,
    tieneRole("superAdmin", "admin"), // Solo roles específicos pueden eliminar
    check("id", "No es un ID válido de MongoDB").isMongoId(),
    check("id").custom(existeContactoBKPorId), // Valida que el contacto exista
    validarCampos,
  ],
  contactoDelete
);

module.exports = router;
