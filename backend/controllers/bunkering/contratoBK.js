const { response, request } = require("express");
const ContratoBK = require("../../models/bunkering/contratoBK");
const ContratoItemsBK = require("../../models/bunkering/contratoItemsBK");
const CuentaBK = require("../../models/bunkering/cuentaBK");

// Opciones de población reutilizables para consultas
const populateOptions = [
  { path: "idBunkering", select: "nombre" },
  { path: "idContacto", select: "nombre" },
  {
    path: "idItems",
    populate: [
      { path: "producto", select: "nombre" },
      { path: "idTipoProducto", select: "nombre" },
    ],
  },
  { path: "createdBy", select: "nombre correo" },
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  },
];

// Obtener todos los contratoBKs
const contratoBKGets = async (req = request, res = response, next) => {
  const query = { eliminado: false };

  try {
    const [total, contratos] = await Promise.all([
      ContratoBK.countDocuments(query),
      ContratoBK.find(query)
        .sort({ numeroContrato: 1 })
        .populate(populateOptions),
    ]);
    // Ordenar historial por fecha descendente en cada contrato
    contratos.forEach((c) => {
      if (Array.isArray(c.historial)) {
        c.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    res.json({ total, contratos });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Obtener un contratoBK específico por ID
const contratoBKGet = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const contrato = await ContratoBK.findOne({
      _id: id,
      eliminado: false,
    }).populate(populateOptions);

    if (!contrato) {
      return res.status(404).json({ msg: "Contrato no encontrado" });
    }

    // Ordenar historial por fecha descendente
    if (Array.isArray(contrato.historial)) {
      contrato.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }

    res.json(contrato);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Crear un nuevo contratoBK
const contratoBKPost = async (req = request, res = response, next) => {
  const {
    numeroContrato,
    descripcion,
    tipoContrato,
    estadoContrato,
    idBunkering,
    idContacto,
    fechaInicio,
    fechaFin,
    brent,
    condicionesPago,
    montoTotal,
    abono,
    destino,
    fechaEnvio,
    estadoEntrega,
    clausulas,
    observacion,
    items,
  } = req.body;

  let nuevoContrato;

  try {
    // Crear el contratoBK
    nuevoContrato = new ContratoBK({
      numeroContrato,
      descripcion,
      tipoContrato,
      estadoContrato,
      idBunkering,
      idContacto,
      fechaInicio,
      fechaFin,
      brent,
      condicionesPago,
      montoTotal,
      abono,
      destino,
      fechaEnvio,
      estadoEntrega,
      clausulas,
      observacion,
      createdBy: req.usuario._id,
    });

    if (!items || items.length === 0) {
      return res.status(400).json({
        error:
          "El contratoBK debe incluir al menos un ítem en el campo 'items'.",
      });
    }

    // Guardar el contratoBK
    await nuevoContrato.save();

    // Crear y guardar los ítems asociados al contratoBK
    const nuevosItems = await Promise.all(
      items.map(async (item) => {
        const nuevoItem = new ContratoItemsBK({
          ...item,
          idContrato: nuevoContrato.id,
        });
        return await nuevoItem.save();
      })
    );

    // Actualizar el contratoBK con los IDs de los ítems
    nuevoContrato.idItems = nuevosItems.map((item) => item.id);
    await nuevoContrato.save();

    // Crear la cuenta asociada al contratoBK
    const nuevaCuentaBK = new CuentaBK({
      idContrato: nuevoContrato._id,
      idContacto: nuevoContrato.idContacto,
      tipoCuentaBK:
        tipoContrato === "Venta"
          ? "CuentaBKs por Cobrar"
          : "CuentaBKs por Pagar",
      abonos: abono || [],
      montoTotalContrato: montoTotal || 0,
    });

    // Guardar la cuenta
    await nuevaCuentaBK.save();

    // Poblar referencias y responder con el contratoBK creado
    await nuevoContrato.populate(populateOptions);
    res.status(201).json(nuevoContrato);
  } catch (err) {
    // Si ocurre un error, eliminar el contratoBK creado
    if (nuevoContrato && nuevoContrato.id) {
      await ContratoBK.findByIdAndDelete(nuevoContrato.id);
    }
    next(err); // Propaga el error al middleware
  }
};

// Actualizar un contratoBK existente (con auditoría)
const contratoBKPut = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { items, abono, ...resto } = req.body;

  try {
    const antes = await ContratoBK.findById(id);
    if (!antes) {
      return res.status(404).json({ msg: "Contrato no encontrado" });
    }

    // Auditoría: comparar cambios
    const cambios = {};
    for (let key in resto) {
      if (String(antes[key]) !== String(resto[key])) {
        cambios[key] = { from: antes[key], to: resto[key] };
      }
    }

    const contratoBKActualizado = await ContratoBK.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        ...resto,
        abono,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    if (!contratoBKActualizado) {
      return res.status(404).json({ msg: "Contrato no encontrado" });
    }

    // Actualizar o crear los ítems asociados al contratoBK
    if (items) {
      const nuevosItems = await Promise.all(
        items.map(async (item) => {
          if (item.id) {
            return await ContratoItemsBK.findByIdAndUpdate(item.id, item, {
              new: true,
            });
          } else {
            const nuevoItem = new ContratoItemsBK({
              ...item,
              idContrato: id,
            });
            return await nuevoItem.save();
          }
        })
      );

      contratoBKActualizado.idItems = nuevosItems.map((item) => item.id);
      await contratoBKActualizado.save();
    }

    // Sincronizar la cuenta asociada al contratoBK
    await CuentaBK.syncFromContrato(contratoBKActualizado);

    // Ordenar historial por fecha descendente
    if (Array.isArray(contratoBKActualizado.historial)) {
      contratoBKActualizado.historial.sort(
        (a, b) => new Date(b.fecha) - new Date(a.fecha)
      );
    }

    res.json(contratoBKActualizado);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Eliminar (marcar como eliminado) un contratoBK (con auditoría)
const contratoBKDelete = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const antes = await ContratoBK.findById(id);
    if (!antes) {
      return res.status(404).json({ msg: "Contrato no encontrado" });
    }

    const cambios = { eliminado: { from: antes.eliminado, to: true } };

    const contratoBKEliminado = await ContratoBK.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        eliminado: true,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    if (!contratoBKEliminado) {
      return res.status(404).json({ msg: "Contrato no encontrado" });
    }

    // Ordenar historial por fecha descendente
    if (Array.isArray(contratoBKEliminado.historial)) {
      contratoBKEliminado.historial.sort(
        (a, b) => new Date(b.fecha) - new Date(a.fecha)
      );
    }

    res.json(contratoBKEliminado);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para manejar actualizaciones parciales (PATCH)
const contratoBKPatch = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { ...resto } = req.body;

  try {
    const antes = await ContratoBK.findById(id);
    if (!antes) {
      return res.status(404).json({ msg: "Contrato no encontrado" });
    }

    const cambios = {};
    for (let key in resto) {
      if (String(antes[key]) !== String(resto[key])) {
        cambios[key] = { from: antes[key], to: resto[key] };
      }
    }

    const contratoBKActualizado = await ContratoBK.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        ...resto,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    if (!contratoBKActualizado) {
      return res.status(404).json({ msg: "Contrato no encontrado" });
    }

    // Ordenar historial por fecha descendente
    if (Array.isArray(contratoBKActualizado.historial)) {
      contratoBKActualizado.historial.sort(
        (a, b) => new Date(b.fecha) - new Date(a.fecha)
      );
    }

    res.json(contratoBKActualizado);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

module.exports = {
  contratoBKPost,
  contratoBKGet,
  contratoBKGets,
  contratoBKPut,
  contratoBKDelete,
  contratoBKPatch,
};
