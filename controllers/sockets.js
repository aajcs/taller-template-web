// Importación del modelo Usuario
const Usuario = require("../models/usuario"); // Modelo Usuario para interactuar con la base de datos
// const Mensaje = require("../models/mensaje"); // (Comentado) Modelo Mensaje para manejar mensajes (si se implementa en el futuro)

// Función para marcar un usuario como conectado
const usuarioConectado = async (id) => {
  // Busca al usuario por su ID en la base de datos
  const usuario = await Usuario.findById(id);
  if (!usuario) {
    return false; // Retorna false si el usuario no existe
  }

  // Marca al usuario como conectado (online)
  usuario.online = true;
  await usuario.save(); // Guarda los cambios en la base de datos

  return usuario; // Retorna el usuario actualizado
};

// Función para marcar un usuario como desconectado
const usuarioDesconectado = async (id) => {
  // Busca al usuario por su ID en la base de datos
  const usuario = await Usuario.findById(id);
  if (!usuario) {
    return false; // Retorna false si el usuario no existe
  }

  // Marca al usuario como desconectado (offline)
  usuario.online = false;
  await usuario.save(); // Guarda los cambios en la base de datos

  return usuario; // Retorna el usuario actualizado
};

// Función para obtener todos los usuarios ordenados por su estado (online primero)
const getUsuarios = async () => {
  // Busca todos los usuarios y los ordena por el campo "online" en orden descendente
  const usuarios = await Usuario.find().sort("-online");

  return usuarios; // Retorna la lista de usuarios
};

// (Comentado) Función para grabar un mensaje en la base de datos
// const grabarMensaje = async( payload ) => {
//     try {
//         // Crea una nueva instancia del modelo Mensaje con los datos proporcionados
//         const mensaje = new Mensaje( payload );
//         await mensaje.save(); // Guarda el mensaje en la base de datos
//         return mensaje; // Retorna el mensaje guardado
//     } catch (error) {
//         console.log(error); // Muestra el error en la consola
//         return false; // Retorna false si ocurre un error
//     }
// }

// Exporta las funciones para que puedan ser utilizadas en otros módulos
module.exports = {
  usuarioConectado, // Marca un usuario como conectado
  usuarioDesconectado, // Marca un usuario como desconectado
  getUsuarios, // Obtiene todos los usuarios ordenados por estado
  // grabarMensaje // (Comentado) Función para grabar mensajes
};
