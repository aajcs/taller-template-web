const { response, request } = require("express");
const CuentaBK = require("../../models/bunkering/cuentaBK");
const ContratoBK = require("../../models/bunkering/contratoBK");

const populateOptions = [
  {
    path: "idContrato",
    select: "numeroContrato tipoContrato montoTotal descripcion estadoContrato",
  },
  {
    path: "idContacto",
    select: "nombre telefono email direccion",
  },
  { path: "createdBy", select: "nombre correo" },
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  },
];

// Obtener todas las cuentasBK
const cuentasBKGets = async (req = request, res = response, next) => {
  const filtro = { eliminado: false };

  try {
    const [total, cuentasBK] = await Promise.all([
      CuentaBK.countDocuments(filtro),
      CuentaBK.find(filtro).populate(populateOptions),
    ]);

    // Ordenar historial por fecha descendente en cada cuenta
    cuentasBK.forEach((c) => {
      if (Array.isArray(c.historial)) {
        c.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });

    res.json({ total, cuentasBK });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Obtener una cuentaBK específica por ID
const cuentaBKGet = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const cuentaBK = await CuentaBK.findOne({
      _id: id,
      eliminado: false,
    }).populate(populateOptions);

    if (!cuentaBK) {
      return res.status(404).json({ msg: "CuentaBK no encontrada" });
    }

    // Ordenar historial por fecha descendente
    if (Array.isArray(cuentaBK.historial)) {
      cuentaBK.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }

    res.json(cuentaBK);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Crear una nueva cuentaBK desde un contrato
const cuentaBKPostFromContrato = async (
  req = request,
  res = response,
  next
) => {
  const { idContrato } = req.body;

  try {
    const contrato = await ContratoBK.findById(idContrato).populate(
      "idContacto",
      "nombre"
    );

    if (!contrato) {
      return res.status(404).json({
        msg: "El contrato no fue encontrado.",
      });
    }

    let tipoCuentaBK;
    if (contrato.tipoContrato === "Venta") {
      tipoCuentaBK = "CuentaBKs por Cobrar";
    } else if (contrato.tipoContrato === "Compra") {
      tipoCuentaBK = "CuentaBKs por Pagar";
    } else {
      return res.status(400).json({
        msg: "El tipo de contrato no es válido. Debe ser 'Venta' o 'Compra'.",
      });
    }

    const nuevaCuentaBK = new CuentaBK({
      idContrato: contrato._id,
      tipoCuentaBK,
      idContacto: contrato.idContacto,
      abonos: contrato.abono || [],
      montoTotalContrato: contrato.montoTotal || 0,
      createdBy: req.usuario._id,
    });

    await nuevaCuentaBK.save();
    await nuevaCuentaBK.populate(populateOptions);

    res.status(201).json({
      msg: "CuentaBK creada correctamente desde el contrato.",
      cuentaBK: nuevaCuentaBK,
    });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Actualizar una cuentaBK existente con historial de modificaciones
const cuentaBKPut = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { _id, ...datosActualizados } = req.body;

  try {
    const cuentaBKAnterior = await CuentaBK.findById(id);
    if (!cuentaBKAnterior) {
      return res.status(404).json({ msg: "CuentaBK no encontrada" });
    }

    const cambios = {};
    for (let key in datosActualizados) {
      if (String(cuentaBKAnterior[key]) !== String(datosActualizados[key])) {
        cambios[key] = {
          from: cuentaBKAnterior[key],
          to: datosActualizados[key],
        };
      }
    }

    const cuentaBKActualizada = await CuentaBK.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        ...datosActualizados,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    if (!cuentaBKActualizada) {
      return res.status(404).json({ msg: "CuentaBK no encontrada" });
    }

    res.json(cuentaBKActualizada);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Eliminar (marcar como eliminado) una cuentaBK con historial de auditoría
const cuentaBKDelete = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const antes = await CuentaBK.findById(id);
    if (!antes) {
      return res.status(404).json({ msg: "CuentaBK no encontrada" });
    }

    const cambios = { eliminado: { from: antes.eliminado, to: true } };

    const cuentaBKEliminada = await CuentaBK.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        eliminado: true,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    if (!cuentaBKEliminada) {
      return res.status(404).json({ msg: "CuentaBK no encontrada" });
    }

    res.json({
      msg: "CuentaBK eliminada correctamente.",
      cuentaBK: cuentaBKEliminada,
    });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Sincronizar una cuentaBK desde un contrato
const cuentaBKSycnFromContrato = async (
  req = request,
  res = response,
  next
) => {
  const { contratoId } = req.params;

  try {
    const contrato = await ContratoBK.findById(contratoId);

    if (!contrato) {
      return res.status(404).json({ msg: "Contrato no encontrado" });
    }

    const cuentaBKSincronizada = await CuentaBK.syncFromContrato(contrato);

    res.json({
      msg: "CuentaBK sincronizada correctamente desde el contrato.",
      cuentaBK: cuentaBKSincronizada,
    });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

module.exports = {
  cuentasBKGets,
  cuentaBKGet,
  cuentaBKPostFromContrato,
  cuentaBKPut,
  cuentaBKDelete,
  cuentaBKSycnFromContrato,
};
