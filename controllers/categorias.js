// Importaciones necesarias
const { response } = require("express"); // Objeto de Express para manejar respuestas
const { Categoria } = require("../models"); // Modelo Categoria para interactuar con la base de datos

// Controlador para obtener todas las categorías
const obtenerCategorias = async (req, res = response) => {
  const query = { estado: true }; // Filtro para obtener solo categorías activas

  const [total, categorias] = await Promise.all([
    Categoria.countDocuments(query), // Cuenta el total de categorías activas
    Categoria.find(query).populate("usuario", "nombre"), // Obtiene las categorías y popula el campo "usuario" con su "nombre"
  ]);

  res.json({
    total, // Total de categorías activas
    categorias, // Lista de categorías
  });
};

// Controlador para obtener una categoría específica por ID
const obtenerCategoria = async (req, res = response) => {
  const { id } = req.params; // Obtiene el ID de la categoría desde los parámetros de la URL
  const categoria = await Categoria.findById(id).populate("usuario", "nombre"); // Busca la categoría por ID y popula el campo "usuario"

  res.json(categoria); // Responde con los datos de la categoría
};

// Controlador para crear una nueva categoría
const crearCategoria = async (req, res = response) => {
  const nombre = req.body.nombre.toUpperCase(); // Convierte el nombre a mayúsculas

  const categoriaDB = await Categoria.findOne({ nombre }); // Verifica si ya existe una categoría con el mismo nombre

  if (categoriaDB) {
    return res.status(400).json({
      msg: `La categoría ${categoriaDB.nombre}, ya existe`, // Responde con un error 400 si la categoría ya existe
    });
  }

  // Generar la data a guardar
  const data = {
    nombre, // Nombre de la categoría
    usuario: req.usuario._id, // ID del usuario que crea la categoría (se asume que viene en la solicitud)
  };

  const categoria = new Categoria(data); // Crea una nueva instancia del modelo Categoria

  // Guardar en la base de datos
  await categoria.save();

  res.status(201).json(categoria); // Responde con un código 201 (creado) y los datos de la categoría
};

// Controlador para actualizar una categoría existente
const actualizarCategoria = async (req, res = response) => {
  const { id } = req.params; // Obtiene el ID de la categoría desde los parámetros de la URL
  const { estado, usuario, ...data } = req.body; // Extrae los datos del cuerpo de la solicitud, excluyendo "estado" y "usuario"

  data.nombre = data.nombre.toUpperCase(); // Convierte el nombre a mayúsculas
  data.usuario = req.usuario._id; // Asigna el ID del usuario que realiza la actualización

  const categoria = await Categoria.findByIdAndUpdate(id, data, { new: true }); // Actualiza la categoría y devuelve el documento actualizado

  res.json(categoria); // Responde con los datos de la categoría actualizada
};

// Controlador para eliminar (desactivar) una categoría
const borrarCategoria = async (req, res = response) => {
  const { id } = req.params; // Obtiene el ID de la categoría desde los parámetros de la URL
  const categoriaBorrada = await Categoria.findByIdAndUpdate(
    id,
    { estado: false }, // Marca la categoría como inactiva (eliminación lógica)
    { new: true } // Devuelve el documento actualizado
  );

  res.json(categoriaBorrada); // Responde con los datos de la categoría desactivada
};

// Exporta los controladores para que puedan ser utilizados en las rutas
module.exports = {
  crearCategoria, // Crear una nueva categoría
  obtenerCategorias, // Obtener todas las categorías
  obtenerCategoria, // Obtener una categoría específica por ID
  actualizarCategoria, // Actualizar una categoría existente
  borrarCategoria, // Eliminar (desactivar) una categoría
};
