// Importaciones necesarias
const { response, request } = require("express"); // Objetos de Express para manejar solicitudes y respuestas
const Contacto = require("../models/contacto"); // Modelo Contacto para interactuar con la base de datos

// Opciones de población reutilizables para consultas
const populateOptions = [
  { path: "idRefineria", select: "nombre" },
  { path: "createdBy", select: "nombre correo" }, // Popula quién creó la torre
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  }, // Popula historial.modificadoPor en el array
]; // Relación con el modelo Refineria, seleccionando solo el campo "nombre"

// Controlador para obtener todos los contactos con población de referencias
const contactoGets = async (req = request, res = response, next) => {
  const query = { eliminado: false }; // Filtro para obtener solo contactos no eliminados

  try {
    const [total, contactos] = await Promise.all([
      Contacto.countDocuments(query), // Cuenta el total de contactos
      Contacto.find(query)
      .sort({ createdAt: -1 }) // Ordena del más nuevo al más antiguo
      .populate(populateOptions), // Obtiene los contactos con referencias pobladas
    ]);
    // Ordenar historial por fecha ascendente en cada torre
    contactos.forEach((t) => {
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    res.json({ total, contactos }); // Responde con el total y la lista de contactos
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para obtener un contacto específico por ID
const contactoGet = async (req = request, res = response, next) => {
  const { id } = req.params; // Obtiene el ID del contacto desde los parámetros de la URL

  try {
    const contacto = await Contacto.findOne({
      _id: id,
      estado: true,
      eliminado: false,
    }).populate(populateOptions); // Busca el contacto por ID y popula las referencias
    // Ordenar historial por fecha ascendente en cada torre
    contacto.forEach((t) => {
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    if (!contacto) {
      return res.status(404).json({ msg: "Contacto no encontrado" }); // Responde con un error 404 si no se encuentra el contacto
    }

    res.json(contacto); // Responde con los datos del contacto
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para crear un nuevo contacto
const contactoPost = async (req = request, res = response, next) => {
  const {
    correo,
    cuentasBancarias,
    cuentasPorCobrar,
    cuentasPorPagar,
    direccion,
    email,
    identificacionFiscal,
    nombre,
    representanteLegal,
    telefono,
    tipo,
    ciudad,
    idRefineria,
  } = req.body; // Extrae los datos del cuerpo de la solicitud

  try {
    const nuevaContacto = new Contacto({
      correo,
      cuentasBancarias,
      cuentasPorCobrar,
      cuentasPorPagar,
      direccion,
      email,
      identificacionFiscal,
      nombre,
      representanteLegal,
      telefono,
      tipo,
      ciudad,
      idRefineria,
      createdBy: req.usuario._id, // ID del usuario que creó el tanque
    });

    await nuevaContacto.save(); // Guarda el nuevo contacto en la base de datos

    await nuevaContacto.populate(populateOptions); // Poblar referencias después de guardar

    res.status(201).json(nuevaContacto); // Responde con un código 201 (creado) y los datos del contacto
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para actualizar un contacto existente
const contactoPut = async (req = request, res = response, next) => {
  const { id } = req.params; // Obtiene el ID del contacto desde los parámetros de la URL
  const { _id, idChequeoCalidad, idChequeoCantidad, ...resto } = req.body; // Extrae los datos del cuerpo de la solicitud, excluyendo ciertos campos

  try {
    const antes = await Contacto.findById(id);
    const cambios = {};
    for (let key in resto) {
      if (String(antes[key]) !== String(resto[key])) {
        cambios[key] = { from: antes[key], to: resto[key] };
      }
    }
    const contactoActualizada = await Contacto.findOneAndUpdate(
      { _id: id, eliminado: false }, // Filtro para encontrar el contacto no eliminado
      {
        ...resto,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      }, // Datos a actualizar
      { new: true } // Devuelve el documento actualizado
    ).populate(populateOptions); // Poblar referencias después de actualizar

    if (!contactoActualizada) {
      return res.status(404).json({ msg: "Contacto no encontrado" }); // Responde con un error 404 si no se encuentra el contacto
    }

    res.json(contactoActualizada); // Responde con los datos del contacto actualizado
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para eliminar (marcar como eliminado) un contacto
const contactoDelete = async (req = request, res = response, next) => {
  const { id } = req.params; // Obtiene el ID del contacto desde los parámetros de la URL

  try {
    // Auditoría: captura estado antes de eliminar
    const antes = await Contacto.findById(id);
    const cambios = { eliminado: { from: antes.eliminado, to: true } };
    const contacto = await Contacto.findOneAndUpdate(
      { _id: id, eliminado: false }, // Filtro para encontrar el contacto no eliminado
      {
        eliminado: true,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true } // Devuelve el documento actualizado
    ).populate(populateOptions); // Poblar referencias después de actualizar

    if (!contacto) {
      return res.status(404).json({ msg: "Contacto no encontrado" }); // Responde con un error 404 si no se encuentra el contacto
    }

    res.json(contacto); // Responde con los datos del contacto eliminado
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para manejar solicitudes PATCH (ejemplo básico)
const contactoPatch = (req = request, res = response, next) => {
  res.json({
    msg: "patch API - contactoPatch", // Mensaje de prueba
  });
};

// Controlador para obtener contactos por idRefineria
const contactoByRefineria = async (req = request, res = response, next) => {
  const { idRefineria } = req.params;
  const query = { eliminado: false, idRefineria };
  try {
    const contactos = await Contacto.find(query).populate(populateOptions);
    contactos.forEach((c) => {
      if (Array.isArray(c.historial)) {
        c.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    res.json({ total: contactos.length, contactos });
  } catch (err) {
    next(err);
  }
};

// Exporta los controladores para que puedan ser utilizados en las rutas
module.exports = {
  contactoGets, // Obtener todos los contactos
  contactoGet, // Obtener un contacto específico por ID
  contactoPost, // Crear un nuevo contacto
  contactoPut, // Actualizar un contacto existente
  contactoDelete, // Eliminar (marcar como eliminado) un contacto
  contactoPatch, // Manejar solicitudes PATCH
  contactoByRefineria, // Obtener contactos por idRefineria
};
