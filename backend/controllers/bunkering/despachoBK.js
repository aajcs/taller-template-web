const { response, request } = require("express");
const DespachoBK = require("../../models/bunkering/despachoBK");

// Opciones de población reutilizables para consultas
const populateOptions = [
  {
    path: "idContrato", // Relación con el modelo Contrato
    select: "idItems numeroContrato", // Selecciona los campos idItems y numeroContrato
    populate: {
      path: "idItems", // Relación con los ítems del contrato
      populate: [
        { path: "producto", select: "nombre" }, // Relación con el modelo Producto
        { path: "idTipoProducto", select: "nombre" }, // Relación con el modelo TipoProducto
      ],
    },
  },
  { path: "idContratoItems", populate: { path: "producto", select: "nombre" } },
  { path: "idLinea", select: "nombre" },
  { path: "idBunkering", select: "nombre" },
  { path: "idMuelle", select: "nombre" },
  { path: "idEmbarcacion", select: "nombre" },
  { path: "idProducto", select: "nombre" },
  { path: "idTanque", select: "nombre" },
  { path: "idChequeoCalidad" },
  { path: "idChequeoCantidad" },
  { path: "createdBy", select: "nombre correo" },
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  },
];

// Obtener todos los despachos con población de referencias ordenados
const despachoBKGets = async (req = request, res = response, next) => {
  const query = { eliminado: false };

  try {
    const [total, despachos] = await Promise.all([
      DespachoBK.countDocuments(query),
      DespachoBK.find(query).populate(populateOptions),
    ]);

    // Ordenar historial por fecha descendente en cada despacho
    despachos.forEach((t) => {
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    // Emitir evento de socket para notificar a los clientes
    res.json({ total, despachos });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Obtener un despacho específica por ID
const despachoBKGet = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const despacho = await DespachoBK.findOne({
      _id: id,
      eliminado: false,
    }).populate(populateOptions);

    if (!despacho) {
      return res.status(404).json({
        msg: "Despacho no encontrado",
      });
    }
    // Ordenar historial por fecha descendente
    if (Array.isArray(despacho.historial)) {
      despacho.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }
    res.json(despacho);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Crear un nuevo despacho
const despachoBKPost = async (req, res = response) => {
  const {
    idContrato,
    idContratoItems,
    idLinea,
    idMuelle,
    idBunkering,
    idEmbarcacion,
    idProducto,
    idTanque,
    idChequeoCalidad,
    idChequeoCantidad,
    cantidadRecibida,
    cantidadEnviada,
    estadoDespacho,
    estadoCarga,
    estado,
    fechaInicio,
    fechaFin,
    fechaInicioDespacho,
    fechaFinDespacho,
    fechaSalida,
    fechaLlegada,
    fechaDespacho,
    muelle,
    bunkering,
    tractomula,
    idGuia,
    placa,
    tipo,
    nombreChofer,
  } = req.body;

  try {
    const nuevoDespacho = new DespachoBK({
      idContrato,
      idContratoItems,
      idLinea,
      idBunkering,
      idEmbarcacion,
      idMuelle,
      idProducto,
      idTanque,
      idChequeoCalidad,
      idChequeoCantidad,
      cantidadRecibida,
      cantidadEnviada,
      estadoDespacho,
      estadoCarga,
      estado,
      fechaInicio,
      fechaFin,
      fechaInicioDespacho,
      fechaFinDespacho,
      fechaSalida,
      fechaLlegada,
      fechaDespacho,
      idGuia,
      placa,
      tipo,
      tractomula,
      muelle,
      bunkering,
      nombreChofer,
      createdBy: req.usuario._id,
    });

    await nuevoDespacho.save();
    await nuevoDespacho.populate(populateOptions);
    res.status(201).json({ despacho: nuevoDespacho }); // Responde con el despacho creado
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Actualizar un despacho existente
const despachoBKPut = async (req, res = response) => {
  const { id } = req.params;
  const { _id, ...resto } = req.body;

  try {
    const antes = await DespachoBK.findById(id);
    if (!antes) {
      return res.status(404).json({ msg: "Despacho no encontrada" });
    }

    const cambios = {};
    for (let key in resto) {
      if (String(antes[key]) !== String(resto[key])) {
        cambios[key] = { from: antes[key], to: resto[key] };
      }
    }
    // Si no hay cambios, no se actualiza el despacho
    const despachoACtualizado = await DespachoBK.findByIdAndUpdate(
      { _id: id, eliminado: false },
      {
        ...resto,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    if (!despachoACtualizado) {
      return res.status(404).json({ msg: "Despacho no encontrado" });
    }

    res.json(despachoACtualizado);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Eliminar (marcar como eliminado) un Despacho
const despachoBKDelete = async (req, res = response) => {
  const { id } = req.params;
  try {
    const antes = await DespachoBK.findById(id);
    if (!antes) {
      return res.status(404).json({ msg: "Despacho no encontrado" });
    }
    // Verifica si el despacho ya está eliminado
    const cambios = { eliminado: { from: antes.eliminado, to: true } };

    const despachoEliminado = await DespachoBK.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        eliminado: true,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    if (!despachoEliminado) {
      return res.status(404).json({ msg: "Despacho no encontrado" });
    }

    res.json(despachoEliminado);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para manejar actualizaciones parciales (PATCH)
const despachoBKPatch = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { ...resto } = req.body;
  // Aquí puedes implementar la lógica para manejar actualizaciones parciales

  try {
    const despachoActualizado = await DespachoBK.findOneAndUpdate(
      { _id: id, eliminado: false },
      { $set: resto },
      { new: true }
    ).populate(populateOptions);

    if (!despachoActualizado) {
      return res.status(404).json({ msg: "Despacho no encontrado" });
    }

    res.json(despachoActualizado);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Exportar los controladores
module.exports = {
  despachoBKPost,
  despachoBKGet,
  despachoBKGets,
  despachoBKPut,
  despachoBKDelete,
  despachoBKPatch,
};
