const { response, request } = require("express");
const Abono = require("../models/abono");
const Contrato = require("../models/contrato");
const Cuenta = require("../models/cuenta");

const populateOptions = [
  {
    path: "idContrato",
    select:
      "numeroContrato descripcion montoTotal montoPagado montoPendiente abono idContacto",
    populate: {
      path: "idContacto",
      select: "nombre telefono direccion correo representanteLegal",
    },
  },
  { path: "idRefineria", select: "nombre img direccion" },
  { path: "createdBy", select: "nombre correo" },
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  },
];

// Obtener todos los abonos, con info de contrato y cuenta asociada
const abonoGets = async (req = request, res = response, next) => {
  const query = { eliminado: false };

  try {
    const [total, abonos] = await Promise.all([
      Abono.countDocuments(query),
      Abono.find(query)
        .sort({ createdAt: -1 }) // Ordena del más nuevo al más antiguo
        .populate(populateOptions),
    ]);

    // Obtener contratos y cuentas asociadas a los abonos
    const contratosIds = abonos.map((a) => a.idContrato);
    const contratos = await Contrato.find({ _id: { $in: contratosIds } });
    const cuentas = await Cuenta.find({ idContrato: { $in: contratosIds } });

    abonos.forEach((a) => {
      if (Array.isArray(a.historial)) {
        a.historial.sort((x, y) => new Date(y.fecha) - new Date(x.fecha));
      }
      a._doc.contrato = contratos.find((c) => c._id.equals(a.idContrato));
      a._doc.cuenta = cuentas.find((c) => c.idContrato.equals(a.idContrato));
    });

    res.json({ total, abonos });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Obtener un abono específico por ID, con info de contrato y cuenta asociada
const abonoGet = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const abono = await Abono.findOne({
      _id: id,
      eliminado: false,
    }).populate(populateOptions);

    if (!abono) {
      return res.status(404).json({ msg: "Abono no encontrado" });
    }

    if (Array.isArray(abono.historial)) {
      abono.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }

    const contrato = await Contrato.findById(abono.idContrato);
    const cuenta = await Cuenta.findOne({ idContrato: abono.idContrato });

    abono._doc.contrato = contrato || null;
    abono._doc.cuenta = cuenta || null;

    res.json(abono);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Crear un nuevo abono, agregarlo al contrato y actualizar la cuenta asociada
const abonoPost = async (req = request, res = response, next) => {
  const {
    idRefineria,
    idContrato,
    monto,
    fecha,
    tipoOperacion,
    referencia,
    tipoAbono,
  } = req.body;

  try {
    // Validar que el contrato exista y no esté eliminado
    const contrato = await Contrato.findOne({
      _id: idContrato,
      eliminado: false,
    });
    if (!contrato) {
      return res.status(404).json({ error: "Contrato no encontrado" });
    }

    // Buscar la cuenta asociada al contrato
    const cuenta = await Cuenta.findOne({ idContrato: contrato._id });
    if (!cuenta) {
      return res
        .status(404)
        .json({ error: "Cuenta asociada al contrato no encontrada" });
    }

    // Crear el abono
    const nuevoAbono = new Abono({
      idRefineria,
      idContrato,
      monto,
      fecha,
      tipoOperacion,
      referencia,
      tipoAbono,
      createdBy: req.usuario._id,
    });

    await nuevoAbono.save();
    await nuevoAbono.populate(populateOptions);

    // Agregar el abono al array del contrato (si usas array de IDs)
    contrato.abonos.push(nuevoAbono._id);
    contrato.montoPagado += monto;
    contrato.montoPendiente = (contrato.montoTotal || 0) - contrato.montoPagado;
    await contrato.save();

    // // Agregar el abono al array de la cuenta (array de IDs)
    cuenta.abonos.push(nuevoAbono._id);

    // CORRECCIÓN PRINCIPAL: Usar el valor calculado en lugar de 5000
    const abonosActivos = await Abono.find({
      _id: { $in: cuenta.abonos },
      eliminado: false,
    });

    // CORRECCIÓN 2: Asegurar que monto sea número usando parseFloat
    const totalAbonado = abonosActivos.reduce(
      (sum, a) => sum + parseFloat(a.monto || 0),
      0
    );

    // Asignar el valor calculado correctamente
    cuenta.totalAbonado = totalAbonado;
    cuenta.balancePendiente = Math.max(
      parseFloat(cuenta.montoTotalContrato || 0) - totalAbonado,
      0
    );

    await cuenta.save();

    res.status(201).json(nuevoAbono);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

const abonoPut = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { monto, fecha, tipoOperacion, referencia } = req.body;

  try {
    const abonoAntes = await Abono.findById(id);
    if (!abonoAntes) {
      return res.status(404).json({ msg: "Abono no encontrado" });
    }

    // Guardar cambios para auditoría
    const cambios = {};
    ["monto", "fecha", "tipoOperacion", "referencia"].forEach((key) => {
      if (String(abonoAntes[key]) !== String(req.body[key])) {
        cambios[key] = { from: abonoAntes[key], to: req.body[key] };
      }
    });

    // Actualizar el abono
    const abonoActualizado = await Abono.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        monto,
        fecha,
        tipoOperacion,
        referencia,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    if (!abonoActualizado) {
      return res.status(404).json({ msg: "Abono no encontrado" });
    }

    // --- ACTUALIZAR CONTRATO ---
    const contrato = await Contrato.findById(abonoAntes.idContrato);
    if (contrato) {
      // Asegúrate de que el abono esté en el array de abonos del contrato
      if (
        !contrato.abonos
          .map((id) => id.toString())
          .includes(abonoAntes._id.toString())
      ) {
        contrato.abonos.push(abonoAntes._id);
      }

      // Recalcular montos usando solo abonos activos
      const abonosContrato = await Abono.find({
        _id: { $in: contrato.abonos },
        eliminado: false,
      });
      contrato.montoPagado = abonosContrato.reduce(
        (sum, a) => sum + parseFloat(a.monto || 0),
        0
      );
      contrato.montoPendiente =
        (contrato.montoTotal || 0) - contrato.montoPagado;
      await contrato.save();
    }

    // --- ACTUALIZAR CUENTA ---
    const cuenta = await Cuenta.findOne({ idContrato: abonoAntes.idContrato });
    if (cuenta) {
      // Asegúrate de que cuenta.abonos esté actualizado
      if (
        !cuenta.abonos
          .map((id) => id.toString())
          .includes(abonoAntes._id.toString())
      ) {
        cuenta.abonos.push(abonoAntes._id);
      }

      const abonosCuenta = await Abono.find({
        _id: { $in: cuenta.abonos },
        eliminado: false,
      });

      // Convierte monto a número para evitar problemas de tipo
      const totalAbonado = abonosCuenta.reduce(
        (sum, a) => sum + parseFloat(a.monto || 0),
        0
      );
      cuenta.totalAbonado = totalAbonado;
      cuenta.balancePendiente = Math.max(
        parseFloat(cuenta.montoTotalContrato || 0) - totalAbonado,
        0
      );
      await cuenta.save();
    }

    res.json(abonoActualizado);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Eliminar (marcar como eliminado) un abono, actualizar el contrato y la cuenta
const abonoDelete = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const abonoAntes = await Abono.findById(id);
    if (!abonoAntes) {
      return res.status(404).json({ msg: "Abono no encontrado" });
    }
    const cambios = { eliminado: { from: abonoAntes.eliminado, to: true } };

    const abono = await Abono.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        eliminado: true,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    if (!abono) {
      return res.status(404).json({ msg: "Abono no encontrado" });
    }

    // Actualizar montos del contrato y eliminar el abono del array de abonos del contrato
    const contrato = await Contrato.findById(abono.idContrato);
    if (contrato) {
      // Eliminar el abono del array de abonos del contrato
      contrato.abonos = contrato.abonos.filter(
        (abonoId) => abonoId.toString() !== abonoAntes._id.toString()
      );

      // Recalcular montos
      const abonosContrato = await Abono.find({
        _id: { $in: contrato.abonos },
        eliminado: false,
      });
      contrato.montoPagado = abonosContrato.reduce(
        (sum, a) => sum + (a.monto || 0),
        0
      );
      contrato.montoPendiente =
        (contrato.montoTotal || 0) - contrato.montoPagado;
      await contrato.save();
    }

    // Actualizar la cuenta y recalcular totales, eliminando el abono del array
    const cuenta = await Cuenta.findOne({ idContrato: abonoAntes.idContrato });
    if (cuenta) {
      cuenta.abonos = cuenta.abonos.filter(
        (abonoId) => abonoId.toString() !== abonoAntes._id.toString()
      );

      const abonosCuenta = await Abono.find({
        _id: { $in: cuenta.abonos },
        eliminado: false,
      });
      const totalAbonado = abonosCuenta.reduce(
        (sum, a) => sum + (a.monto || 0),
        0
      );
      cuenta.totalAbonado = totalAbonado;
      cuenta.balancePendiente = Math.max(
        (cuenta.montoTotalContrato || 0) - totalAbonado,
        0
      );
      await cuenta.save();
    }

    res.json(abono);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

const abonoPatch = (req, res = response) => {
  res.json({
    msg: "patch API - abonoPatch",
  });
};

const sumarAbonosPorTipoYFecha = async (req, res, next) => {
  try {
    const { tipoAbono, mes, anio } = req.query;
    const fechaInicio = new Date(anio, mes - 1, 1);
    const fechaFin = new Date(anio, mes, 1);

    // Busca los abonos filtrados y popula la info relacionada
    const abonos = await Abono.find({
      tipoAbono,
      fecha: { $gte: fechaInicio, $lt: fechaFin },
      eliminado: false,
    }).populate(populateOptions);

    // Suma los montos
    const totalMonto = abonos.reduce(
      (sum, a) => sum + parseFloat(a.monto || 0),
      0
    );

    res.json({
      tipoAbono,
      totalMonto,
      cantidad: abonos.length,
      abonos, // Incluye la información populada
    });
  } catch (err) {
    next(err);
  }
};

// Controlador para obtener abonos por refinería
const abonosByRefineria = async (req = request, res = response, next) => {
  const { idRefineria } = req.params;
  const query = { eliminado: false, idRefineria };
  try {
    const abonos = await Abono.find(query).populate(populateOptions);
    abonos.forEach((a) => {
      if (Array.isArray(a.historial)) {
        a.historial.sort((x, y) => new Date(y.fecha) - new Date(x.fecha));
      }
    });
    res.json({ total: abonos.length, abonos });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  abonoGets,
  abonoGet,
  abonoPost,
  abonoPut,
  abonoDelete,
  abonoPatch,
  sumarAbonosPorTipoYFecha,
  abonosByRefineria,
};
