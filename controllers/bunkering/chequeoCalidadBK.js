const { response, request } = require("express");
const mongoose = require("mongoose");
const ChequeoCalidadBK = require("../../models/bunkering/chequeoCalidadBK");
const RecepcionBK = require("../../models/bunkering/recepcionBK");
const DespachoBK = require("../../models/bunkering/despachoBK");
const TanqueBK = require("../../models/bunkering/tanqueBK");

// Opciones de población reutilizables para consultas
const populateOptions = [
  { path: "idBunkering", select: "nombre" },
  {
    path: "aplicar.idReferencia",
    select: {
      nombre: 1,
      idGuia: 1,
    },
  },
  { path: "idProducto", select: "nombre" },
  { path: "idOperador", select: "nombre" },
  { path: "createdBy", select: "nombre correo" },
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  },
];

// Función auxiliar para actualizar el modelo relacionado
const actualizarModeloRelacionadoBK = async (idReferencia, tipo, datos) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(idReferencia)) {
      throw new Error(`El ID de referencia no es válido: ${idReferencia}`);
    }

    const modelo =
      tipo === "Recepcion"
        ? RecepcionBK
        : tipo === "Despacho"
        ? DespachoBK
        : tipo === "Tanque"
        ? TanqueBK
        : null;

    if (!modelo) {
      throw new Error(`Tipo de modelo no válido: ${tipo}`);
    }

    const documentoExistente = await modelo.findById(idReferencia);
    if (!documentoExistente) {
      throw new Error(
        `No se encontró el modelo ${tipo} con ID: ${idReferencia}`
      );
    }

    const resultado = await modelo.findByIdAndUpdate(
      idReferencia,
      { $set: datos },
      { new: true }
    );

    if (!resultado) {
      throw new Error(
        `No se pudo actualizar el modelo ${tipo} con ID: ${idReferencia}`
      );
    }

    return resultado;
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para obtener todos los chequeos de calidad
const chequeoCalidadBKGets = async (req = request, res = response, next) => {
  const query = { eliminado: false };

  try {
    const [total, chequeoCalidads] = await Promise.all([
      ChequeoCalidadBK.countDocuments(query),
      ChequeoCalidadBK.find(query).populate(populateOptions),
    ]);

    // Ordenar historial por fecha descendente en cada chequeo
    chequeoCalidads.forEach((c) => {
      if (Array.isArray(c.historial)) {
        c.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });

    res.json({ total, chequeoCalidads });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para obtener un chequeo de calidad específico por ID
const chequeoCalidadBKGet = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const chequeoCalidad = await ChequeoCalidadBK.findOne({
      _id: id,
      eliminado: false,
    }).populate(populateOptions);

    if (!chequeoCalidad) {
      return res.status(404).json({ msg: "Chequeo de calidad no encontrado" });
    }

    // Ordenar historial por fecha descendente
    if (Array.isArray(chequeoCalidad.historial)) {
      chequeoCalidad.historial.sort(
        (a, b) => new Date(b.fecha) - new Date(a.fecha)
      );
    }

    res.json(chequeoCalidad);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para crear un nuevo chequeo de calidad
const chequeoCalidadBKPost = async (req = request, res = response, next) => {
  const {
    idBunkering,
    aplicar,
    idProducto,
    fechaChequeo,
    gravedadAPI,
    azufre,
    contenidoAgua,
    puntoDeInflamacion,
    cetano,
    idOperador,
    estado,
  } = req.body;

  try {
    const nuevoChequeo = new ChequeoCalidadBK({
      idBunkering,
      aplicar,
      idProducto,
      fechaChequeo,
      gravedadAPI,
      azufre,
      contenidoAgua,
      puntoDeInflamacion,
      cetano,
      idOperador,
      estado,
      createdBy: req.usuario._id,
    });

    await nuevoChequeo.save();
    await nuevoChequeo.populate(populateOptions);

    // Actualizar el modelo relacionado
    if (aplicar && aplicar.idReferencia && aplicar.tipo) {
      await actualizarModeloRelacionadoBK(aplicar.idReferencia, aplicar.tipo, {
        idChequeoCalidad: nuevoChequeo._id,
      });
    }

    res.status(201).json(nuevoChequeo);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para actualizar un chequeo de calidad existente
const chequeoCalidadBKPut = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { _id, aplicar, ...resto } = req.body;

  try {
    // Validar que idReferencia sea un ObjectId válido
    if (
      aplicar &&
      aplicar.idReferencia &&
      !mongoose.Types.ObjectId.isValid(aplicar.idReferencia)
    ) {
      return res.status(400).json({
        error: "El ID de referencia no es válido.",
      });
    }
    const antes = await ChequeoCalidadBK.findById(id);
    const cambios = {};
    for (let key in resto) {
      if (String(antes[key]) !== String(resto[key])) {
        cambios[key] = { from: antes[key], to: resto[key] };
      }
    }

    const chequeoActualizado = await ChequeoCalidadBK.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        ...resto,
        aplicar,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    if (!chequeoActualizado) {
      return res.status(404).json({ msg: "Chequeo de calidad no encontrado" });
    }

    // Actualizar el modelo relacionado
    if (aplicar && aplicar.idReferencia && aplicar.tipo) {
      await actualizarModeloRelacionadoBK(aplicar.idReferencia, aplicar.tipo, {
        idChequeoCalidad: chequeoActualizado._id,
      });
    }

    res.json(chequeoActualizado);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para manejar actualizaciones parciales (PATCH)
const chequeoCalidadBKPatch = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { _id, aplicar, ...resto } = req.body;

  try {
    const chequeoActualizado = await ChequeoCalidadBK.findOneAndUpdate(
      { _id: id, eliminado: false },
      { $set: resto },
      { new: true }
    ).populate(populateOptions);

    if (!chequeoActualizado) {
      return res.status(404).json({ msg: "Chequeo de calidad no encontrado" });
    }

    // Actualizar el modelo relacionado
    if (aplicar && aplicar.idReferencia && aplicar.tipo) {
      await actualizarModeloRelacionadoBK(aplicar.idReferencia, aplicar.tipo, {
        chequeoCalidad: chequeoActualizado._id,
      });
    }

    res.json(chequeoActualizado);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para eliminar (marcar como eliminado) un chequeo de calidad
const chequeoCalidadBKDelete = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    // Auditoría: captura estado antes de eliminar
    const antes = await ChequeoCalidadBK.findById(id);
    const cambios = { eliminado: { from: antes.eliminado, to: true } };
    const chequeo = await ChequeoCalidadBK.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        eliminado: true,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    if (!chequeo) {
      return res.status(404).json({ msg: "Chequeo de calidad no encontrado" });
    }

    // Actualizar el modelo relacionado
    if (
      chequeo.aplicar &&
      chequeo.aplicar.idReferencia &&
      chequeo.aplicar.tipo
    ) {
      await actualizarModeloRelacionadoBK(
        chequeo.aplicar.idReferencia,
        chequeo.aplicar.tipo,
        {
          chequeoCalidad: null,
        }
      );
    }

    res.json(chequeo);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

module.exports = {
  chequeoCalidadBKGets, // Obtener todos los chequeos de calidad
  chequeoCalidadBKGet, // Obtener un chequeo de calidad específico por ID
  chequeoCalidadBKPost, // Crear un nuevo chequeo de calidad
  chequeoCalidadBKPut, // Actualizar un chequeo de calidad existente
  chequeoCalidadBKPatch, // Actualizar parcialmente un chequeo de calidad
  chequeoCalidadBKDelete, // Eliminar (marcar como eliminado) un chequeo de calidad
};
