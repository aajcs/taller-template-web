// Importaciones necesarias
const { response } = require("express"); // Objeto de Express para manejar respuestas
const { ObjectId } = require("mongoose").Types; // Utilidad para validar IDs de MongoDB

const { Usuario, Categoria, Producto } = require("../models"); // Modelos para interactuar con la base de datos

// Lista de colecciones permitidas para realizar búsquedas
const coleccionesPermitidas = ["usuarios", "categorias", "productos", "roles"];

// Función para buscar usuarios
const buscarUsuarios = async (termino = "", res = response) => {
  const esMongoID = ObjectId.isValid(termino); // Verifica si el término es un ID válido de MongoDB

  if (esMongoID) {
    const usuario = await Usuario.findById(termino); // Busca el usuario por ID
    return res.json({
      results: usuario ? [usuario] : [], // Devuelve el usuario si existe, o un array vacío
    });
  }

  const regex = new RegExp(termino, "i"); // Expresión regular para búsqueda insensible a mayúsculas/minúsculas
  const usuarios = await Usuario.find({
    $or: [{ nombre: regex }, { correo: regex }], // Busca por nombre o correo
    $and: [{ estado: true }], // Solo usuarios activos
  });

  res.json({
    results: usuarios, // Devuelve los usuarios encontrados
  });
};

// Función para buscar categorías
const buscarCategorias = async (termino = "", res = response) => {
  const esMongoID = ObjectId.isValid(termino); // Verifica si el término es un ID válido de MongoDB

  if (esMongoID) {
    const categoria = await Categoria.findById(termino); // Busca la categoría por ID
    return res.json({
      results: categoria ? [categoria] : [], // Devuelve la categoría si existe, o un array vacío
    });
  }

  const regex = new RegExp(termino, "i"); // Expresión regular para búsqueda insensible a mayúsculas/minúsculas
  const categorias = await Categoria.find({ nombre: regex, estado: true }); // Busca por nombre y estado activo

  res.json({
    results: categorias, // Devuelve las categorías encontradas
  });
};

// Función para buscar productos
const buscarProductos = async (termino = "", res = response) => {
  const esMongoID = ObjectId.isValid(termino); // Verifica si el término es un ID válido de MongoDB

  if (esMongoID) {
    const producto = await Producto.findById(termino).populate(
      "categoria",
      "nombre"
    ); // Pobla la categoría asociada al producto
    return res.json({
      results: producto ? [producto] : [], // Devuelve el producto si existe, o un array vacío
    });
  }

  const regex = new RegExp(termino, "i"); // Expresión regular para búsqueda insensible a mayúsculas/minúsculas
  const productos = await Producto.find({
    nombre: regex,
    estado: true,
  }).populate("categoria", "nombre"); // Pobla la categoría asociada al producto

  res.json({
    results: productos, // Devuelve los productos encontrados
  });
};

// Función principal para manejar las búsquedas
const buscar = (req, res = response) => {
  const { coleccion, termino } = req.params; // Obtiene la colección y el término de búsqueda desde los parámetros de la URL

  // Verifica si la colección está permitida
  if (!coleccionesPermitidas.includes(coleccion)) {
    return res.status(400).json({
      msg: `Las colecciones permitidas son: ${coleccionesPermitidas}`, // Devuelve un error si la colección no es válida
    });
  }

  // Llama a la función de búsqueda correspondiente según la colección
  switch (coleccion) {
    case "usuarios":
      buscarUsuarios(termino, res);
      break;
    case "categorias":
      buscarCategorias(termino, res);
      break;
    case "productos":
      buscarProductos(termino, res);
      break;
    default:
      res.status(500).json({
        msg: "Se le olvidó implementar esta búsqueda", // Mensaje de error para casos no manejados
      });
  }
};

// Exporta la función principal para que pueda ser utilizada en las rutas
module.exports = {
  buscar,
};
