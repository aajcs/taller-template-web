// Importaciones necesarias
const path = require("path"); // Módulo para trabajar con rutas de archivos y directorios
const fs = require("fs"); // Módulo para trabajar con el sistema de archivos

const cloudinary = require("cloudinary").v2; // Librería para trabajar con Cloudinary
cloudinary.config(process.env.CLOUDINARY_URL); // Configura Cloudinary con la URL de tu entorno

const { response } = require("express"); // Objeto de respuesta de Express
const { subirArchivo } = require("../helpers"); // Función personalizada para subir archivos

const { Usuario, Producto } = require("../models"); // Modelos de Usuario y Producto

// Controlador para cargar un archivo al servidor
const cargarArchivo = async (req, res = response) => {
  try {
    // Subir archivo al servidor (por defecto en la carpeta 'imgs')
    const nombre = await subirArchivo(req.files, undefined, "imgs");
    res.json({ nombre }); // Responde con el nombre del archivo subido
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para actualizar la imagen de un usuario o producto en el servidor
const actualizarImagen = async (req, res = response) => {
  const { id, coleccion } = req.params; // Obtiene el ID y la colección desde los parámetros de la URL

  let modelo;

  // Verifica la colección y busca el modelo correspondiente
  switch (coleccion) {
    case "usuarios":
      modelo = await Usuario.findById(id); // Busca el usuario por ID
      if (!modelo) {
        return res.status(400).json({
          msg: `No existe un usuario con el id ${id}`,
        });
      }
      break;

    case "productos":
      modelo = await Producto.findById(id); // Busca el producto por ID
      if (!modelo) {
        return res.status(400).json({
          msg: `No existe un producto con el id ${id}`,
        });
      }
      break;

    default:
      return res
        .status(500)
        .json({ msg: "Validación de colección no implementada" });
  }

  // Elimina la imagen previa si existe
  if (modelo.img) {
    const pathImagen = path.join(
      __dirname,
      "../uploads",
      coleccion,
      modelo.img
    ); // Ruta de la imagen previa
    if (fs.existsSync(pathImagen)) {
      fs.unlinkSync(pathImagen); // Elimina la imagen del servidor
    }
  }

  // Sube la nueva imagen y actualiza el modelo
  const nombre = await subirArchivo(req.files, undefined, coleccion);
  modelo.img = nombre;

  await modelo.save(); // Guarda los cambios en la base de datos

  res.json(modelo); // Responde con el modelo actualizado
};

// Controlador para actualizar la imagen en Cloudinary
const actualizarImagenCloudinary = async (req, res = response) => {
  const { id, coleccion } = req.params; // Obtiene el ID y la colección desde los parámetros de la URL

  let modelo;

  // Verifica la colección y busca el modelo correspondiente
  switch (coleccion) {
    case "usuarios":
      modelo = await Usuario.findById(id); // Busca el usuario por ID
      if (!modelo) {
        return res.status(400).json({
          msg: `No existe un usuario con el id ${id}`,
        });
      }
      break;

    case "productos":
      modelo = await Producto.findById(id); // Busca el producto por ID
      if (!modelo) {
        return res.status(400).json({
          msg: `No existe un producto con el id ${id}`,
        });
      }
      break;

    default:
      return res
        .status(500)
        .json({ msg: "Validación de colección no implementada" });
  }

  // Elimina la imagen previa de Cloudinary si existe
  if (modelo.img) {
    const nombreArr = modelo.img.split("/"); // Divide la URL de la imagen
    const nombre = nombreArr[nombreArr.length - 1]; // Obtiene el nombre del archivo
    const [public_id] = nombre.split("."); // Obtiene el ID público de Cloudinary
    cloudinary.uploader.destroy(public_id); // Elimina la imagen de Cloudinary
  }

  // Sube la nueva imagen a Cloudinary
  const { tempFilePath } = req.files.archivo; // Obtiene la ruta temporal del archivo
  const { secure_url } = await cloudinary.uploader.upload(tempFilePath); // Sube la imagen a Cloudinary
  modelo.img = secure_url; // Actualiza la URL de la imagen en el modelo

  await modelo.save(); // Guarda los cambios en la base de datos

  res.json(modelo); // Responde con el modelo actualizado
};

// Controlador para mostrar una imagen
const mostrarImagen = async (req, res = response) => {
  const { id, coleccion } = req.params; // Obtiene el ID y la colección desde los parámetros de la URL

  let modelo;

  // Verifica la colección y busca el modelo correspondiente
  switch (coleccion) {
    case "usuarios":
      modelo = await Usuario.findById(id); // Busca el usuario por ID
      if (!modelo) {
        return res.status(400).json({
          msg: `No existe un usuario con el id ${id}`,
        });
      }
      break;

    case "productos":
      modelo = await Producto.findById(id); // Busca el producto por ID
      if (!modelo) {
        return res.status(400).json({
          msg: `No existe un producto con el id ${id}`,
        });
      }
      break;

    default:
      return res
        .status(500)
        .json({ msg: "Validación de colección no implementada" });
  }

  // Verifica si existe una imagen asociada al modelo
  if (modelo.img) {
    const pathImagen = path.join(
      __dirname,
      "../uploads",
      coleccion,
      modelo.img
    ); // Ruta de la imagen
    if (fs.existsSync(pathImagen)) {
      return res.sendFile(pathImagen); // Envía la imagen como respuesta
    }
  }

  // Si no existe una imagen, envía una imagen por defecto
  const pathImagen = path.join(__dirname, "../assets/no-image.jpg");
  res.sendFile(pathImagen);
};

// Exporta los controladores para que puedan ser utilizados en las rutas
module.exports = {
  cargarArchivo, // Subir un archivo al servidor
  actualizarImagen, // Actualizar una imagen en el servidor
  mostrarImagen, // Mostrar una imagen
  actualizarImagenCloudinary, // Actualizar una imagen en Cloudinary
};
