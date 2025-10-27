const { response, request } = require("express");
const TanqueBK = require("../../models/bunkering/tanqueBK");

// Opciones de población reutilizables para consultas
const populateOptions = [
  { path: "idBunkering", select: "nombre" },
  {
    path: "idProducto",
    select: "nombre color posicion",
  },
  {
    path: "idEmbarcacion",
    select: "nombre imo tipo",
  },
  { path: "createdBy", select: "nombre correo" },
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  },
];

// Obtener todos los tanques con historial ordenado
const tanqueGets = async (req = request, res = response, next) => {
  const query = { eliminado: false };

  try {
    const [total, tanques] = await Promise.all([
      TanqueBK.countDocuments(query),
      TanqueBK.find(query).populate(populateOptions),
    ]);

    // Ordenar historial por fecha descendente en cada tanque
    tanques.forEach((t) => {
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });

    res.json({ total, tanques });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Obtener un tanque específico por ID
const tanqueGet = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const tanque = await TanqueBK.findOne({
      _id: id,
      eliminado: false,
    }).populate(populateOptions);

    if (!tanque) {
      return res.status(404).json({ msg: "Tanque no encontrado." });
    }

    // Ordenar historial por fecha descendente
    if (Array.isArray(tanque.historial)) {
      tanque.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }

    res.json(tanque);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Crear un nuevo tanque
const tanquePost = async (req = request, res = response, next) => {
  const {
    nombre,
    capacidad,
    almacenamiento,
    ubicacion,
    idProducto,
    idEmbarcacion,
    idChequeoCalidad,
    idChequeoCantidad,
    idBunkering,
  } = req.body;

  try {
    // Validar duplicidad de nombre de tanque en la misma embarcación y bunkering
    if (idEmbarcacion && nombre) {
      const Embarcacion = require("../../models/bunkering/embarcacion");
      const embarcacion = await Embarcacion.findById(idEmbarcacion).populate(
        "idBunkering"
      );
      if (!embarcacion) {
        return res.status(400).json({ error: "Embarcación no encontrada." });
      }
      const tanqueDuplicado = await TanqueBK.findOne({
        nombre: nombre.trim(),
        idEmbarcacion: idEmbarcacion,
        eliminado: false,
      });
      if (tanqueDuplicado) {
        return res.status(400).json({
          error: `Ya existe un tanque con el nombre "${nombre}" en la embarcación "${
            embarcacion.nombre
          }" asociada al bunkering "${embarcacion.idBunkering?.nombre || ""}".`,
        });
      }
    }

    const nuevoTanque = new TanqueBK({
      nombre,
      capacidad,
      almacenamiento,
      ubicacion,
      idProducto,
      idEmbarcacion,
      idChequeoCalidad,
      idChequeoCantidad,
      idBunkering,
      createdBy: req.usuario._id,
    });

    await nuevoTanque.save();

    // Agregar el ID del tanque al arreglo `tanques` de la embarcación
    if (idEmbarcacion) {
      const Embarcacion = require("../../models/bunkering/embarcacion");
      await Embarcacion.findByIdAndUpdate(
        idEmbarcacion,
        { $push: { tanques: nuevoTanque._id } },
        { new: true }
      );
    }

    await nuevoTanque.populate(populateOptions);

    res.status(201).json(nuevoTanque);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Actualizar un tanque existente con historial de modificaciones
const tanquePut = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { _id, idEmbarcacion, nombre, ...resto } = req.body;

  try {
    const tanqueAnterior = await TanqueBK.findById(id);
    if (!tanqueAnterior) {
      return res.status(404).json({ msg: "Tanque no encontrado." });
    }

    // Validar duplicidad de nombre de tanque en la misma embarcación y bunkering (si cambia el nombre o embarcación)
    if (
      (nombre && nombre.trim() !== tanqueAnterior.nombre) ||
      (idEmbarcacion && String(tanqueAnterior.idEmbarcacion) !== idEmbarcacion)
    ) {
      const Embarcacion = require("../../models/bunkering/embarcacion");
      const embarcacionId = idEmbarcacion || tanqueAnterior.idEmbarcacion;
      const embarcacion = await Embarcacion.findById(embarcacionId).populate(
        "idBunkering"
      );
      if (!embarcacion) {
        return res.status(400).json({ error: "Embarcación no encontrada." });
      }
      const tanqueDuplicado = await TanqueBK.findOne({
        nombre: (nombre || tanqueAnterior.nombre).trim(),
        idEmbarcacion: embarcacionId,
        eliminado: false,
        _id: { $ne: id },
      });
      if (tanqueDuplicado) {
        return res.status(400).json({
          error: `Ya existe un tanque con el nombre "${
            nombre || tanqueAnterior.nombre
          }" en la embarcación "${embarcacion.nombre}" asociada al bunkering "${
            embarcacion.idBunkering?.nombre || ""
          }".`,
        });
      }
    }

    // Si el idEmbarcacion cambia, actualiza el arreglo `tanques` en las embarcaciones
    if (
      idEmbarcacion &&
      String(tanqueAnterior.idEmbarcacion) !== idEmbarcacion
    ) {
      const Embarcacion = require("../../models/bunkering/embarcacion");

      // Remover el tanque del arreglo `tanques` de la embarcación anterior
      await Embarcacion.findByIdAndUpdate(tanqueAnterior.idEmbarcacion, {
        $pull: { tanques: tanqueAnterior._id },
      });

      // Agregar el tanque al arreglo `tanques` de la nueva embarcación
      await Embarcacion.findByIdAndUpdate(idEmbarcacion, {
        $push: { tanques: tanqueAnterior._id },
      });
    }

    // Auditoría: detectar cambios
    const cambios = {};
    for (let key in resto) {
      if (String(tanqueAnterior[key]) !== String(resto[key])) {
        cambios[key] = { from: tanqueAnterior[key], to: resto[key] };
      }
    }
    if (nombre && nombre.trim() !== tanqueAnterior.nombre) {
      cambios.nombre = { from: tanqueAnterior.nombre, to: nombre.trim() };
    }
    if (
      idEmbarcacion &&
      String(tanqueAnterior.idEmbarcacion) !== idEmbarcacion
    ) {
      cambios.idEmbarcacion = {
        from: tanqueAnterior.idEmbarcacion,
        to: idEmbarcacion,
      };
    }

    // Actualizar el tanque y registrar el historial
    const tanqueActualizado = await TanqueBK.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        ...resto,
        nombre: nombre || tanqueAnterior.nombre,
        idEmbarcacion: idEmbarcacion || tanqueAnterior.idEmbarcacion,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    if (!tanqueActualizado) {
      return res.status(404).json({ msg: "Tanque no encontrado." });
    }

    res.json(tanqueActualizado);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Eliminar (marcar como eliminado) un tanque con historial de auditoría
const tanqueDelete = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const antes = await TanqueBK.findById(id);
    if (!antes) {
      return res.status(404).json({ msg: "Tanque no encontrado." });
    }

    const cambios = { eliminado: { from: antes.eliminado, to: true } };

    const tanqueEliminado = await TanqueBK.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        eliminado: true,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    if (!tanqueEliminado) {
      return res.status(404).json({ msg: "Tanque no encontrado." });
    }

    res.json(tanqueEliminado);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para manejar actualizaciones parciales (PATCH)
const tanquePatch = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { ...resto } = req.body;

  try {
    const tanqueActualizado = await TanqueBK.findOneAndUpdate(
      { _id: id, eliminado: false },
      { $set: resto },
      { new: true }
    ).populate(populateOptions);

    if (!tanqueActualizado) {
      return res.status(404).json({ msg: "Tanque no encontrado." });
    }

    res.json(tanqueActualizado);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

module.exports = {
  tanquePost,
  tanqueGet,
  tanqueGets,
  tanquePut,
  tanqueDelete,
  tanquePatch,
};
