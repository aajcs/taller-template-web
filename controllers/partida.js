// Importaciones necesarias
const { response, request } = require("express");
const Partida = require("../models/partida");

// Opciones de población reutilizables
const populateOptions = [
  { path: "idRefineria", select: "nombre" },
  { path: "createdBy", select: "nombre correo" }, // Popula quién creó la torre
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  }, // Popula historial.modificadoPor en el array
];

// Controlador para obtener todas las partidas
const partidaGets = async (req = request, res = response, next) => {
  const query = { eliminado: false }; // Filtro para obtener solo las partidas no eliminadas

  try {
    const [total, partidas] = await Promise.all([
      Partida.countDocuments(query), // Cuenta el total de partidas
      Partida.find(query).populate(populateOptions), // Aplica las opciones de población
    ]);

    // Ordenar historial por fecha ascendente en cada partida
    partidas.forEach((t) => {
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });

    res.json({ total, partidas }); // Responde con el total y la lista de partidas
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para obtener una partida específica por ID
const partidaGet = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const partida = await Partida.findById(id).populate(populateOptions); // Aplica las opciones de población
    // Ordenar historial por fecha ascendente en cada partida
    if (Array.isArray(partida.historial)) {
      partida.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }

    if (!partida) {
      return res.status(404).json({
        msg: "Partida no encontrada",
      });
    }

    res.json(partida); // Responde con los datos de la partida
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para crear una nueva partida
const partidaPost = async (req = request, res = response, next) => {
  const { idRefineria, descripcion, codigo, color } = req.body;

  try {
    const nuevaPartida = new Partida({
      idRefineria,
      descripcion,
      codigo,
      color,
      createdBy: req.usuario._id, // ID del usuario que crea la partida
    });

    await nuevaPartida.save(); // Guarda la nueva partida en la base de datos

    res.status(201).json(nuevaPartida); // Responde con un código 201 (creado) y los datos de la partida
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para actualizar una partida existente
const partidaPut = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { _id, ...resto } = req.body; // Excluye el campo _id del cuerpo de la solicitud
  try {
    // Obtener la partida antes de la actualización
    const antes = await Partida.findById(id);
    if (!antes) {
      return res.status(404).json({ msg: "Partida no encontrada" });
    }

    // Detectar cambios entre los datos actuales y los nuevos
    const cambios = {};
    for (let key in resto) {
      if (String(antes[key]) !== String(resto[key])) {
        cambios[key] = { from: antes[key], to: resto[key] };
      }
    }

    const { historial, ...restoSinHistorial } = resto;

    const partidaActualizada = await Partida.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        ...restoSinHistorial,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    if (!partidaActualizada) {
      return res.status(404).json({ msg: "Partida no encontrada" });
    }

    res.json(partidaActualizada); // Responde con los datos de la partida actualizada
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para manejar actualizaciones parciales (PATCH)
const partidaPatch = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { _id, ...resto } = req.body; // Excluye el campo _id del cuerpo de la solicitud

  try {
    const partidaActualizada = await Partida.findOneAndUpdate(
      { _id: id, eliminado: false }, // Filtro para encontrar la partida no eliminada
      { $set: resto }, // Actualiza solo los campos proporcionados
      { new: true } // Devuelve el documento actualizado
    ).populate(populateOptions); // Aplica las opciones de población

    if (!partidaActualizada) {
      return res.status(404).json({
        msg: "Partida no encontrada",
      });
    }

    res.json(partidaActualizada); // Responde con los datos de la partida actualizada
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para eliminar (marcar como eliminada) una partida
const partidaDelete = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    // Auditoría: captura estado antes de eliminar
    const antes = await Partida.findById(id);
    if (!antes) {
      return res.status(404).json({ msg: "Partida no encontrada" });
    }

    const cambios = { eliminado: { from: antes.eliminado, to: true } };

    // Marcar la partida como eliminada y registrar los cambios en el historial
    const partida = await Partida.findOneAndUpdate(
      { _id: id, eliminado: false }, // Filtro para encontrar la partida no eliminada
      {
        eliminado: true, // Marca la partida como eliminada
        $push: { historial: { modificadoPor: req.usuario._id, cambios } }, // Agrega los cambios al historial
      },
      { new: true } // Devuelve el documento actualizado
    ).populate(populateOptions); // Aplica las opciones de población

    if (!partida) {
      return res.status(404).json({ msg: "Partida no encontrada" });
    }

    // Aquí puedes agregar lógica adicional si necesitas actualizar referencias relacionadas
    // Por ejemplo, eliminar referencias de otras colecciones asociadas a la partida

    res.json({
      msg: "Partida eliminada y cambios registrados en el historial.",
      partida,
    });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para obtener partidas por idRefineria
const partidasByRefineria = async (req = request, res = response, next) => {
  const { idRefineria } = req.params;
  const query = { eliminado: false, idRefineria };
  try {
    const partidas = await Partida.find(query).populate(populateOptions);
    partidas.forEach((p) => {
      if (Array.isArray(p.historial)) {
        p.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    res.json({ total: partidas.length, partidas });
  } catch (err) {
    next(err);
  }
};

// Exporta los controladores para que puedan ser utilizados en las rutas
module.exports = {
  partidaGets, // Obtener todas las partidas
  partidaGet, // Obtener una partida específica por ID
  partidaPost, // Crear una nueva partida
  partidaPut, // Actualizar una partida existente
  partidaPatch, // Actualizar parcialmente una partida
  partidaDelete, // Eliminar (marcar como eliminada) una partida
  partidasByRefineria, // Obtener partidas por idRefineria
};
