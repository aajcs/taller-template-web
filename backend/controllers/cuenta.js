const { response, request } = require("express");
const Cuenta = require("../models/cuenta");
const Contrato = require("../models/contrato");

// Opciones de población reutilizables
const populateOptions = [
  {
    path: "idContrato",
    select:
      "numeroContrato tipoContrato montoTotal descripcion estadoContrato idItems",
    populate: {
      path: "idItems",
      select: "cantidad precioUnitario",
    },
  },
  { path: "idRefineria", select: "nombre" }, // Relación con el modelo Refineria
  {
    path: "idContacto",
    select: "nombre telefono email direccion",
  },
  { path: "abonos", select: "monto fecha referencia numeroAbono" }, // Relación con el modelo Abono
];

// Controlador para obtener todas las cuentas
const cuentaGets = async (req = request, res = response, next) => {
  const query = {}; // Filtro para obtener solo cuentas no eliminadas

  try {
    const [total, cuentas] = await Promise.all([
      Cuenta.countDocuments(query),
      Cuenta.find(query)
        .sort({ createdAt: -1 }) // Ordena del más nuevo al más antiguo
        .populate(populateOptions),
    ]);

    res.json({ total, cuentas });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para obtener una cuenta específica por ID
const cuentaGet = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const cuenta = await Cuenta.findById(id).populate(populateOptions);

    if (!cuenta || cuenta.eliminado) {
      return res.status(404).json({ msg: "Cuenta no encontrada" });
    }

    res.json(cuenta);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para crear una nueva cuenta desde un contrato
const cuentaPostFromContrato = async (req = request, res = response, next) => {
  const { idContrato } = req.body;

  try {
    const contrato = await Contrato.findById(idContrato).populate(
      "idContacto",
      "nombre"
    );

    if (!contrato) {
      return res.status(404).json({
        msg: "El contrato no fue encontrado.",
      });
    }

    let tipoCuenta;
    if (contrato.tipoContrato === "Venta") {
      tipoCuenta = "Cuentas por Cobrar";
    } else if (contrato.tipoContrato === "Compra") {
      tipoCuenta = "Cuentas por Pagar";
    } else {
      return res.status(400).json({
        msg: "El tipo de contrato no es válido. Debe ser 'Venta' o 'Compra'.",
      });
    }

    // Calcula el balance pendiente correctamente
    const montoTotal = contrato.montoTotal || 0;
    const abonos = contrato.abono || [];
    const montoAbonado = abonos.reduce((sum, a) => sum + (a.monto || 0), 0);
    const balancePendiente = montoTotal - montoAbonado;

    const nuevaCuenta = new Cuenta({
      idContrato: contrato._id,
      tipoCuenta,
      idContacto: contrato.idContacto,
      abonos: abonos,
      montoTotalContrato: montoTotal,
      balancePendiente, // <-- Aquí se inicializa correctamente
      createdBy: req.usuario._id,
      fechaCuenta: contrato.fechaInicio || new Date(),
    });

    await nuevaCuenta.save();

    // Devuelve la cuenta populada
    const cuentaPopulada = await Cuenta.findById(nuevaCuenta._id).populate(
      populateOptions
    );

    res.status(201).json({
      msg: "Cuenta creada correctamente desde el contrato.",
      cuenta: cuentaPopulada,
    });
  } catch (err) {
    next(err);
  }
};

// Controlador para actualizar una cuenta existente
const cuentaPut = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { _id, ...resto } = req.body;

  try {
    const antes = await Cuenta.findById(id);
    const cambios = {};
    for (let key in resto) {
      if (String(antes[key]) !== String(resto[key])) {
        cambios[key] = { from: antes[key], to: resto[key] };
      }
    }

    const cuentaActualizada = await Cuenta.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        ...resto,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    if (!cuentaActualizada) {
      return res.status(404).json({ msg: "Cuenta no encontrada" });
    }

    res.json(cuentaActualizada);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para eliminar (marcar como eliminado) una cuenta
const cuentaDelete = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const antes = await Cuenta.findById(id);
    const cambios = { eliminado: { from: antes.eliminado, to: true } };

    const cuentaEliminada = await Cuenta.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        eliminado: true,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    if (!cuentaEliminada) {
      return res.status(404).json({ msg: "Cuenta no encontrada" });
    }

    res.json({
      msg: "Cuenta eliminada correctamente.",
      cuenta: cuentaEliminada,
    });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para sincronizar una cuenta desde un contrato
const cuentaSyncFromContrato = async (req = request, res = response, next) => {
  const { contratoId } = req.params;

  try {
    const contrato = await Contrato.findById(contratoId);

    if (!contrato) {
      return res.status(404).json({ msg: "Contrato no encontrado" });
    }

    const cuentaExistente = await Cuenta.findOne({ idContrato: contratoId });

    if (!cuentaExistente) {
      return res
        .status(404)
        .json({ msg: "Cuenta no encontrada para sincronizar." });
    }

    const cambios = {};
    if (cuentaExistente.montoTotalContrato !== contrato.montoTotal) {
      cambios.montoTotalContrato = {
        from: cuentaExistente.montoTotalContrato,
        to: contrato.montoTotal,
      };
    }

    const cuentaSincronizada = await Cuenta.findOneAndUpdate(
      { idContrato: contratoId },
      {
        montoTotalContrato: contrato.montoTotal,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    res.json({
      msg: "Cuenta sincronizada correctamente desde el contrato.",
      cuenta: cuentaSincronizada,
    });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

const cuentaSaldosPendientes = async (req = request, res = response, next) => {
  try {
    const { idRefineria } = req.query;
    const filtro = {};
    if (idRefineria) {
      filtro.idRefineria = idRefineria;
    }

    const cuentas = await Cuenta.find(filtro).populate(populateOptions);

    let totalPorCobrar = 0;
    let totalPorPagar = 0;
    const porCobrar = [];
    const porPagar = [];

    cuentas.forEach((cuenta) => {
      const info = {
        numeroContrato: cuenta.idContrato?.numeroContrato || "",
        balancePendiente: Number(cuenta.balancePendiente || 0),
        nombreContacto: cuenta.idContacto?.nombre || "",
      };

      if (cuenta.tipoCuenta === "Cuentas por Cobrar") {
        totalPorCobrar += info.balancePendiente;
        porCobrar.push(info);
      }
      if (cuenta.tipoCuenta === "Cuentas por Pagar") {
        totalPorPagar += info.balancePendiente;
        porPagar.push(info);
      }
    });

    res.json({
      totalPorCobrar,
      totalPorPagar,
      porCobrar,
      porPagar,
    });
  } catch (err) {
    next(err);
  }
};

const cuentaAgruparPorContacto = async (
  req = request,
  res = response,
  next
) => {
  try {
    const { tipoCuenta } = req.query; // "Cuentas por Cobrar" o "Cuentas por Pagar"
    const filtro = {};
    if (tipoCuenta) {
      filtro.tipoCuenta = tipoCuenta;
    }

    // Trae las cuentas con el contacto populado
    const cuentas = await Cuenta.find(filtro).populate({
      path: "idContacto",
      select: "nombre",
    });

    // Agrupa por nombre de contacto y suma los montos
    const agrupadas = {};
    cuentas.forEach((cuenta) => {
      const nombre = cuenta.idContacto?.nombre || "Sin Nombre";
      if (!agrupadas[nombre]) {
        agrupadas[nombre] = {
          nombreContacto: nombre,
          total: 0,
          cuentas: [],
        };
      }
      agrupadas[nombre].total += Number(cuenta.balancePendiente || 0);
      agrupadas[nombre].cuentas.push({
        id: cuenta._id,
        numeroContrato: cuenta.idContrato?.numeroContrato || "",
        balancePendiente: Number(cuenta.balancePendiente || 0),
      });
    });

    // Devuelve como array
    res.json(Object.values(agrupadas));
  } catch (err) {
    next(err);
  }
};
// Controlador para obtener cuentas por refinería
const cuentasByRefineria = async (req = request, res = response, next) => {
  const { idRefineria } = req.params;
  const query = { idRefineria };
  try {
    const cuentas = await Cuenta.find(query).populate(populateOptions);
    cuentas.forEach((c) => {
      if (Array.isArray(c.historial)) {
        c.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    res.json({ total: cuentas.length, cuentas });
  } catch (err) {
    next(err);
  }
};
module.exports = {
  cuentaGets,
  cuentaGet,
  cuentaPostFromContrato,
  cuentaPut,
  cuentaDelete,
  cuentaSyncFromContrato,
  cuentaSaldosPendientes,
  cuentaAgruparPorContacto,
  cuentasByRefineria,
};
