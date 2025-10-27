const Balance = require("../models/balance");
const Contrato = require("../models/contrato");
const Factura = require("../models/factura");

// Opciones de población reutilizables
const populateOptions = [
  {
    path: "contratosCompras",
    select: "numeroContrato tipoContrato montoTotal descripcion estadoContrato",
    populate: {
      path: "idItems",
      populate: {
        path: "producto",
        select: "nombre",
      },
      select: "cantidad producto",
    },
  },
  {
    path: "contratosVentas",
    select: "numeroContrato tipoContrato montoTotal descripcion estadoContrato",
    populate: {
      path: "idItems",
      populate: {
        path: "producto",
        select: "nombre  ",
      },
      select: "cantidad producto precioUnitario ",
    },
  },
  { path: "facturas", select: "total concepto fechaFactura" },
  { path: "createdBy", select: "nombre correo" },
  { path: "idRefineria", select: "nombre img direccion" },
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  },
];

const balanceGets = async (req, res = response, next) => {
  // Busca balances donde eliminado sea false o no exista
  const query = {
    $or: [{ eliminado: false }, { eliminado: { $exists: false } }],
  };

  try {
    const [total, balances] = await Promise.all([
      Balance.countDocuments(query),
      Balance.find(query).populate(populateOptions).sort({ fechaInicio: -1 }),
    ]);

    res.json({ total, balances });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Obtener un balance específico por ID
const balanceGet = async (req, res = response, next) => {
  const { id } = req.params;

  try {
    const balance = await Balance.findOne({
      _id: id,
      eliminado: false,
    }).populate(populateOptions);

    if (!balance) {
      return res.status(404).json({ msg: "Balance no encontrado." });
    }

    res.json(balance);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Crear un nuevo balance
const balancePost = async (req, res = response, next) => {
  const {
    fechaInicio,
    fechaFin,
    contratosCompras,
    contratosVentas,
    facturas,
    idRefineria,
  } = req.body;

  try {
    console.log(req.body); // Log para depuración
    // Validar que los contratos no estén ya asociados a otro balance
    const contratosUsados = await Contrato.find({
      _id: { $in: [...contratosCompras, ...contratosVentas] },
      idBalance: { $exists: true, $ne: null },
    });
    if (contratosUsados.length > 0) {
      return res.status(400).json({
        error: "Uno o más contratos ya están asociados a otro balance.",
        contratos: contratosUsados.map((c) => c.numeroContrato),
      });
    }

    // Obtener contratos con sus items populados
    const compras = await Contrato.find({
      _id: { $in: contratosCompras },
      tipoContrato: "Compra",
      eliminado: false,
    }).populate("idItems");
    const ventas = await Contrato.find({
      _id: { $in: contratosVentas },
      tipoContrato: "Venta",
      eliminado: false,
    }).populate("idItems");
    const facturasSeleccionadas = await Factura.find({
      _id: { $in: facturas },
    });

    // Calcular total de barriles de compra
    const totalBarrilesCompra = compras.reduce((total, contrato) => {
      return (
        total +
        contrato.idItems.reduce((sum, item) => sum + (item.cantidad || 0), 0)
      );
    }, 0);

    // Calcular total de barriles de venta
    const totalBarrilesVenta = ventas.reduce((total, contrato) => {
      return (
        total +
        contrato.idItems.reduce((sum, item) => sum + (item.cantidad || 0), 0)
      );
    }, 0);

    // Calcular totales monetarios
    const totalCompras = compras.reduce(
      (total, compra) => total + (compra.montoTotal || 0),
      0
    );
    const totalVentas = ventas.reduce(
      (total, venta) => total + (venta.montoTotal || 0),
      0
    );
    const totalFacturas = facturasSeleccionadas.reduce(
      (total, factura) => total + (factura.total || 0),
      0
    );

    const ganancia = totalVentas - totalCompras - totalFacturas;
    const perdida = ganancia < 0 ? Math.abs(ganancia) : 0;

    // Crear el balance
    const nuevoBalance = new Balance({
      fechaInicio,
      fechaFin,
      contratosCompras,
      contratosVentas,
      facturas,
      totalCompras,
      totalVentas: totalVentas - totalFacturas,
      ganancia: ganancia > 0 ? ganancia : 0,
      perdida,
      idRefineria,
      totalBarrilesCompra,
      totalBarrilesVenta,
      createdBy: req.usuario._id,
    });

    await nuevoBalance.save();

    // Asignar idBalance a cada contrato involucrado
    await Contrato.updateMany(
      { _id: { $in: [...contratosCompras, ...contratosVentas] } },
      { $set: { idBalance: nuevoBalance._id } }
    );

    const balancePopulado = await Balance.findById(nuevoBalance._id).populate(
      populateOptions
    );
    res.status(201).json(balancePopulado);
  } catch (err) {
    next(err);
  }
};

// Actualizar un balance existente
const balancePut = async (req, res = response, next) => {
  const { id } = req.params;
  if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ msg: "El ID proporcionado no es válido." });
  }
  const {
    contratosCompras = [],
    contratosVentas = [],
    facturas = [],
    ...resto
  } = req.body;

  try {
    const antes = await Balance.findById(id);
    if (!antes) {
      return res.status(404).json({ msg: "Balance no encontrado." });
    }

    // Detectar contratos eliminados (ya no están en el arreglo)
    const contratosQuitados = [
      ...antes.contratosCompras.filter(
        (c) => !contratosCompras.includes(String(c))
      ),
      ...antes.contratosVentas.filter(
        (c) => !contratosVentas.includes(String(c))
      ),
    ];
    if (contratosQuitados.length > 0) {
      await Contrato.updateMany(
        { _id: { $in: contratosQuitados } },
        { $unset: { idBalance: "" } }
      );
    }

    // Detectar contratos nuevos agregados
    const prevCompras = antes.contratosCompras.map((c) => String(c));
    const prevVentas = antes.contratosVentas.map((c) => String(c));
    const nuevosCompras = contratosCompras.filter(
      (c) => !prevCompras.includes(String(c))
    );
    const nuevosVentas = contratosVentas.filter(
      (c) => !prevVentas.includes(String(c))
    );
    const nuevosContratos = [...nuevosCompras, ...nuevosVentas];

    // Validar que los nuevos contratos no estén en otro balance
    if (nuevosContratos.length > 0) {
      const usados = await Contrato.find({
        _id: { $in: nuevosContratos },
        idBalance: { $exists: true, $ne: null },
      });
      if (usados.length > 0) {
        return res.status(400).json({
          error:
            "Uno o más contratos agregados ya están asociados a otro balance.",
          contratos: usados.map((c) => c.numeroContrato),
        });
      }
      await Contrato.updateMany(
        { _id: { $in: nuevosContratos } },
        { $set: { idBalance: id } }
      );
    }

    // --- RECALCULAR TOTALES Y BARRILES ---
    // Obtener contratos con sus items populados
    const compras = await Contrato.find({
      _id: { $in: contratosCompras },
      tipoContrato: "Compra",
      eliminado: false,
    }).populate("idItems");
    const ventas = await Contrato.find({
      _id: { $in: contratosVentas },
      tipoContrato: "Venta",
      eliminado: false,
    }).populate("idItems");
    const facturasSeleccionadas = await Factura.find({
      _id: { $in: facturas },
    });

    // Calcular total de barriles de compra
    const totalBarrilesCompra = compras.reduce((total, contrato) => {
      return (
        total +
        contrato.idItems.reduce((sum, item) => sum + (item.cantidad || 0), 0)
      );
    }, 0);

    // Calcular total de barriles de venta
    const totalBarrilesVenta = ventas.reduce((total, contrato) => {
      return (
        total +
        contrato.idItems.reduce((sum, item) => sum + (item.cantidad || 0), 0)
      );
    }, 0);

    // Calcular totales monetarios
    const totalCompras = compras.reduce(
      (total, compra) => total + (compra.montoTotal || 0),
      0
    );
    const totalVentas = ventas.reduce(
      (total, venta) => total + (venta.montoTotal || 0),
      0
    );
    const totalFacturas = facturasSeleccionadas.reduce(
      (total, factura) => total + (factura.total || 0),
      0
    );

    const ganancia = totalVentas - totalCompras - totalFacturas;
    const perdida = ganancia < 0 ? Math.abs(ganancia) : 0;

    // Auditoría: detectar cambios
    const cambios = {};
    [
      "fechaInicio",
      "fechaFin",
      "totalCompras",
      "totalVentas",
      "ganancia",
      "perdida",
      "totalBarrilesCompra",
      "totalBarrilesVenta",
      "idRefineria",
    ].forEach((key) => {
      if (
        typeof req.body[key] !== "undefined" &&
        String(antes[key]) !== String(req.body[key])
      ) {
        cambios[key] = { from: antes[key], to: req.body[key] };
      }
    });
    if (JSON.stringify(prevCompras) !== JSON.stringify(contratosCompras)) {
      cambios.contratosCompras = { from: prevCompras, to: contratosCompras };
    }
    if (JSON.stringify(prevVentas) !== JSON.stringify(contratosVentas)) {
      cambios.contratosVentas = { from: prevVentas, to: contratosVentas };
    }

    // Actualizar el balance
    const balanceActualizado = await Balance.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        ...resto,
        contratosCompras,
        contratosVentas,
        facturas,
        totalCompras,
        totalVentas: totalVentas - totalFacturas,
        ganancia: ganancia > 0 ? ganancia : 0,
        perdida,
        totalBarrilesCompra, // <-- Agrega este campo
        totalBarrilesVenta, // <-- Agrega este campo
        $push: {
          historial: {
            modificadoPor: req.usuario._id,
            cambios,
            fecha: new Date(),
          },
        },
      },
      { new: true }
    ).populate(populateOptions);

    res.json(balanceActualizado);
  } catch (err) {
    next(err);
  }
};

// Actualizar parcialmente un balance existente
const balancePatch = async (req, res = response, next) => {
  const { id } = req.params;
  const {
    contratosCompras = [],
    contratosVentas = [],
    facturas = [],
    ...resto
  } = req.body;

  try {
    const antes = await Balance.findById(id);
    if (!antes) {
      return res.status(404).json({ msg: "Balance no encontrado." });
    }

    // Detectar contratos eliminados (ya no están en el arreglo)
    const contratosQuitados = [
      ...antes.contratosCompras.filter(
        (c) => !contratosCompras.includes(String(c))
      ),
      ...antes.contratosVentas.filter(
        (c) => !contratosVentas.includes(String(c))
      ),
    ];
    if (contratosQuitados.length > 0) {
      await Contrato.updateMany(
        { _id: { $in: contratosQuitados } },
        { $unset: { idBalance: "" } }
      );
    }

    // Detectar contratos nuevos agregados
    const prevCompras = antes.contratosCompras.map((c) => String(c));
    const prevVentas = antes.contratosVentas.map((c) => String(c));
    const nuevosCompras = contratosCompras.filter(
      (c) => !prevCompras.includes(String(c))
    );
    const nuevosVentas = contratosVentas.filter(
      (c) => !prevVentas.includes(String(c))
    );
    const nuevosContratos = [...nuevosCompras, ...nuevosVentas];

    // Validar que los nuevos contratos no estén en otro balance
    if (nuevosContratos.length > 0) {
      const usados = await Contrato.find({
        _id: { $in: nuevosContratos },
        idBalance: { $exists: true, $ne: null },
      });
      if (usados.length > 0) {
        return res.status(400).json({
          error:
            "Uno o más contratos agregados ya están asociados a otro balance.",
          contratos: usados.map((c) => c.numeroContrato),
        });
      }
      // Asignar idBalance a los nuevos contratos
      await Contrato.updateMany(
        { _id: { $in: nuevosContratos } },
        { $set: { idBalance: id } }
      );
    }

    // --- RECALCULAR TOTALES Y BARRILES ---
    const compras = await Contrato.find({
      _id: { $in: contratosCompras },
      tipoContrato: "Compra",
      eliminado: false,
    }).populate("idItems");
    const ventas = await Contrato.find({
      _id: { $in: contratosVentas },
      tipoContrato: "Venta",
      eliminado: false,
    }).populate("idItems");
    const facturasSeleccionadas = await Factura.find({
      _id: { $in: facturas },
    });

    const totalBarrilesCompra = compras.reduce((total, contrato) => {
      return (
        total +
        contrato.idItems.reduce((sum, item) => sum + (item.cantidad || 0), 0)
      );
    }, 0);

    const totalBarrilesVenta = ventas.reduce((total, contrato) => {
      return (
        total +
        contrato.idItems.reduce((sum, item) => sum + (item.cantidad || 0), 0)
      );
    }, 0);

    const totalCompras = compras.reduce(
      (total, compra) => total + (compra.montoTotal || 0),
      0
    );
    const totalVentas = ventas.reduce(
      (total, venta) => total + (venta.montoTotal || 0),
      0
    );
    const totalFacturas = facturasSeleccionadas.reduce(
      (total, factura) => total + (factura.total || 0),
      0
    );

    const ganancia = totalVentas - totalCompras - totalFacturas;
    const perdida = ganancia < 0 ? Math.abs(ganancia) : 0;

    // Auditoría: detectar cambios
    const cambios = {};
    ["fechaInicio", "fechaFin", "idRefineria"].forEach((key) => {
      if (
        typeof req.body[key] !== "undefined" &&
        String(antes[key]) !== String(req.body[key])
      ) {
        cambios[key] = { from: antes[key], to: req.body[key] };
      }
    });
    if (JSON.stringify(prevCompras) !== JSON.stringify(contratosCompras)) {
      cambios.contratosCompras = { from: prevCompras, to: contratosCompras };
    }
    if (JSON.stringify(prevVentas) !== JSON.stringify(contratosVentas)) {
      cambios.contratosVentas = { from: prevVentas, to: contratosVentas };
    }

    // Actualizar el balance parcialmente
    const balanceActualizado = await Balance.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        ...resto,
        contratosCompras,
        contratosVentas,
        facturas,
        totalCompras,
        totalVentas: totalVentas - totalFacturas,
        ganancia: ganancia > 0 ? ganancia : 0,
        perdida,
        totalBarrilesCompra,
        totalBarrilesVenta,
        $push: {
          historial: {
            modificadoPor: req.usuario._id,
            cambios,
            fecha: new Date(),
          },
        },
      },
      { new: true }
    ).populate(populateOptions);

    if (!balanceActualizado) {
      return res.status(404).json({ msg: "Balance no encontrado." });
    }

    res.json(balanceActualizado);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Eliminar un balance (eliminación lógica)
// Eliminar un balance (eliminación lógica)
const balanceDelete = async (req, res = response, next) => {
  const { id } = req.params;

  try {
    const antes = await Balance.findById(id);
    if (!antes) {
      return res.status(404).json({ msg: "Balance no encontrado." });
    }

    // Quitar idBalance de los contratos asociados
    await Contrato.updateMany(
      { _id: { $in: [...antes.contratosCompras, ...antes.contratosVentas] } },
      { $unset: { idBalance: "" } }
    );

    // Auditoría: guardar cambios
    const cambios = { eliminado: { from: antes.eliminado, to: true } };

    // Eliminar el balance (lógica actual)
    const balance = await Balance.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        eliminado: true,
        $push: {
          historial: {
            modificadoPor: req.usuario._id,
            cambios,
            fecha: new Date(),
          },
        },
      },
      { new: true }
    ).populate(populateOptions);

    if (!balance) {
      return res.status(404).json({ msg: "Balance no encontrado." });
    }

    res.json({
      msg: "Balance eliminado exitosamente.",
      balance,
    });
  } catch (err) {
    next(err);
  }
};

// Controlador para obtener balances por refinería
const balancesByRefineria = async (req, res = response, next) => {
  const { idRefineria } = req.params;
  const query = { eliminado: false, idRefineria };
  try {
    const balances = await Balance.find(query).populate(populateOptions);
    balances.forEach((b) => {
      if (Array.isArray(b.historial)) {
        b.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    res.json({ total: balances.length, balances });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  balanceGets,
  balanceGet,
  balancePost,
  balancePut,
  balanceDelete,
  balancePatch,
  balancesByRefineria,
};
