// Importaciones necesarias
const { response, request } = require("express"); // Importa objetos de Express para manejar solicitudes y respuestas
const bcryptjs = require("bcryptjs"); // Librería para encriptar contraseñas
const populateOptions = [
  { path: "createdBy", select: "nombre correo" }, // Popula quién creó la torre
  { path: "idRefineria", select: "nombre" },
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  }, // Popula historial.modificadoPor en el array
];
const Usuario = require("../models/usuario"); // Modelo de Usuario para interactuar con la base de datos
const { generarJWT } = require("../helpers"); // Función para generar tokens JWT

// Controlador para obtener todos los usuarios no eliminados
const usuariosGets = async (req = request, res = response, next) => {
  const query = {
    // departamento: { $in: ["Finanzas"] },
    eliminado: false,
    // $or: [
    //   { acceso: "completo" },
    //   { acceso: "limitado", idRefineria: "685abcb476ada69b5bc1d294" },
    // ],
  }; // Filtro para obtener solo usuarios no eliminados y cuyo departamento esté en el array

  // Ejecuta ambas consultas en paralelo para optimizar el tiempo de respuesta
  const [total, usuarios] = await Promise.all([
    Usuario.countDocuments(query), // Cuenta el total de usuarios no eliminados
    Usuario.find(query)
      .sort({ createdAt: -1 }) // Ordena del más nuevo al más antiguo
      .populate(populateOptions), // Obtiene los usuarios no eliminados
  ]);
  // Ordenar historial por fecha ascendente en cada torre
  usuarios.forEach((t) => {
    if (Array.isArray(t.historial)) {
      t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }
  });
  // Responde con el total de usuarios y la lista de usuarios
  res.json({
    total,
    usuarios,
  });
};

// Controlador para obtener un usuario por su ID
const usuariosGet = async (req = request, res = response, next) => {
  const { id } = req.params; // Obtiene el ID del usuario desde los parámetros de la URL
  const usuario = await Usuario.findById(id).populate(populateOptions); // Busca el usuario por su ID
  // Ordenar historial por fecha ascendente en cada torre
  // usuario.forEach((t) => {
  //   if (Array.isArray(t.historial)) {
  //     t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  //   }
  // });
  // Verifica si el usuario existe y no está marcado como eliminado
  if (usuario && !usuario.eliminado) {
    res.json(usuario); // Responde con los datos del usuario
  } else {
    // Responde con un error 404 si el usuario no existe o está eliminado
    res.status(404).json({
      msg: "Usuario no encontrado o eliminado",
    });
  }
};

// Controlador para crear un nuevo usuario
const usuariosPost = async (req, res = response) => {
  // Extrae los datos del cuerpo de la solicitud
  const {
    nombre,
    correo,
    password,
    rol,
    estado,
    acceso,
    idRefineria,
    departamento,
    telefono,
  } = req.body;

  // Crea una nueva instancia del modelo Usuario con los datos proporcionados
  const usuario = new Usuario({
    idRefineria,
    nombre,
    correo,
    password,
    rol,
    acceso,
    estado,
    departamento,
    telefono,
    createdBy: req.usuario._id, // ID del usuario que creó el tanque
  });

  try {
    // Verifica si el correo ya existe en la base de datos
    const correoLower = correo.toLowerCase();
    const existeCorreo = await Usuario.findOne({ correo: correoLower });
    usuario.correo = correoLower;
    if (existeCorreo) {
      const error = new Error("El correo ya está registrado");
      error.status = 409;
      return next(error);
    }
    // Encripta la contraseña antes de guardarla en la base de datos
    const salt = bcryptjs.genSaltSync(); // Genera un "salt" para la encriptación
    usuario.password = bcryptjs.hashSync(password, salt); // Encripta la contraseña

    // Guarda el usuario en la base de datos
    await usuario.save();
    await usuario.populate(populateOptions);
    // Genera un token JWT para el usuario recién creado
    const token = await generarJWT(usuario.id);

    // Responde con los datos del usuario y el token generado
    res.json({
      usuario,
      token,
    });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para actualizar un usuario por su ID
const usuariosPut = async (req, res = response) => {
  const { id } = req.params; // Obtiene el ID del usuario desde los parámetros de la URL
  const { _id, password, correo, ...resto } = req.body; // Extrae los datos del cuerpo de la solicitud, excluyendo _id y correo

  // Si se proporciona una nueva contraseña, encripta la contraseña antes de actualizarla
  if (password) {
    const salt = bcryptjs.genSaltSync(); // Genera un "salt" para la encriptación
    resto.password = bcryptjs.hashSync(password, salt); // Encripta la nueva contraseña
  }
  const antes = await Usuario.findById(id);
  const cambios = {};
  for (let key in resto) {
    if (String(antes[key]) !== String(resto[key])) {
      cambios[key] = { from: antes[key], to: resto[key] };
    }
  } // Actualiza el tipo de producto en la base de datos y devuelve el tipo de producto actualizado
  // Actualiza el usuario en la base de datos y devuelve el usuario actualizado
  const usuario = await Usuario.findByIdAndUpdate(
    id,
    {
      ...resto,
      $push: { historial: { modificadoPor: req.usuario._id, cambios } },
    },
    { new: true }
  ).populate(populateOptions);

  // Responde con los datos del usuario actualizado
  res.json(usuario);
};

// Controlador para manejar solicitudes PATCH (no implementado)
const usuariosPatch = (req, res = response) => {
  res.json({
    msg: "patch API - usuariosPatch", // Mensaje de prueba
  });
};

// Controlador para eliminar un usuario de forma lógica
const usuariosDelete = async (req, res = response) => {
  const { id } = req.params; // Obtiene el ID del usuario desde los parámetros de la URL
  // Auditoría: captura estado antes de eliminar
  const antes = await Usuario.findById(id);
  const cambios = { eliminado: { from: antes.eliminado, to: true } };
  // Marca el usuario como eliminado (eliminación lógica)
  const usuario = await Usuario.findByIdAndUpdate(
    id,
    {
      eliminado: true,
      $push: { historial: { modificadoPor: req.usuario._id, cambios } },
    },
    { new: true } // Devuelve el usuario actualizado
  ).populate(populateOptions);

  // Responde con los datos del usuario eliminado
  res.json(usuario);
};

// Exporta los controladores para que puedan ser utilizados en las rutas
module.exports = {
  usuariosGets, // Obtener todos los usuarios
  usuariosPost, // Crear un nuevo usuario
  usuariosPut, // Actualizar un usuario
  usuariosPatch, // Manejar solicitudes PATCH
  usuariosDelete, // Eliminar un usuario de forma lógica
  usuariosGet, // Obtener un usuario por su ID
};
