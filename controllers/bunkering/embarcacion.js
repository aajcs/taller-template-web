const { response, request } = require("express");
const Embarcacion = require("../../models/bunkering/embarcacion");
const TanqueBK = require("../../models/bunkering/tanqueBK");

// Opciones de población para referencias en las consultas
const populateOptions = [
  { path: "idBunkering", select: "nombre" },
  {
    path: "tanques",
    select:
      "nombre capacidad almacenamiento ubicacion idProducto idEmbarcacion idChequeoCalidad idChequeoCantidad idBunkering eliminado",
    populate: [
      { path: "idProducto", select: "nombre" },
      { path: "idEmbarcacion", select: "nombre" },
      { path: "idChequeoCalidad", select: "nombre" },
      { path: "idChequeoCantidad", select: "nombre" },
      { path: "idBunkering", select: "nombre" },
    ],
  },
  { path: "createdBy", select: "nombre correo" },
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  },
];

// Obtener todas las embarcaciones
const embarcacionesGets = async (req = request, res = response, next) => {
  const query = { eliminado: false };

  try {
    const [total, embarcacions] = await Promise.all([
      Embarcacion.countDocuments(query),
      Embarcacion.find(query).sort({ nombre: 1 }).populate(populateOptions),
    ]);
    embarcacions.forEach((t) => {
      // Filtrar tanques eliminados lógicamente
      if (Array.isArray(t.tanques)) {
        t.tanques = t.tanques.filter((tanque) => !tanque.eliminado);
      }
      if (Array.isArray(t.historial)) {
        t.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });
    res.json({ total, embarcacions });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Obtener una embarcación específica por ID
const embarcacionGet = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const embarcacion = await Embarcacion.findOne({
      _id: id,
      eliminado: false,
    }).populate(populateOptions);
    if (!embarcacion) {
      return res.status(404).json({ msg: "Embarcación no encontrada." });
    }

    // Ordenar historial por fecha descendente
    if (Array.isArray(embarcacion.historial)) {
      embarcacion.historial.sort(
        (a, b) => new Date(b.fecha) - new Date(a.fecha)
      );
    }

    // Filtrar tanques eliminados lógicamente
    if (Array.isArray(embarcacion.tanques)) {
      embarcacion.tanques = embarcacion.tanques.filter((t) => !t.eliminado);
    }

    res.json(embarcacion);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Crear una nueva embarcación y sus tanques asociados (con rollback si hay error en tanques)
const embarcacionPost = async (req = request, res = response, next) => {
  const { idBunkering, capacidad, nombre, imo, tipo, tanques } = req.body;

  const session = await Embarcacion.startSession();
  session.startTransaction();

  try {
    const nuevaEmbarcacion = new Embarcacion({
      idBunkering,
      capacidad,
      nombre,
      imo,
      tipo,
      createdBy: req.usuario._id,
    });

    await nuevaEmbarcacion.save({ session });

    let tanquesIds = [];
    if (Array.isArray(tanques) && tanques.length > 0) {
      for (const tanqueData of tanques) {
        // Validar duplicidad de nombre de tanque en la misma embarcación y bunkering
        const existe = await TanqueBK.findOne({
          nombre: tanqueData.nombre.trim(),
          idEmbarcacion: nuevaEmbarcacion._id,
          eliminado: false,
        }).session(session);
        if (existe) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            error: `Ya existe un tanque con el nombre "${tanqueData.nombre}" en esta embarcación.`,
          });
        }
        const nuevoTanque = new TanqueBK({
          nombre: tanqueData.nombre,
          capacidad: tanqueData.capacidad,
          almacenamiento: tanqueData.almacenamiento,
          ubicacion: tanqueData.ubicacion,
          idProducto: tanqueData.idProducto,
          idEmbarcacion: nuevaEmbarcacion._id,
          idChequeoCalidad: tanqueData.idChequeoCalidad,
          idChequeoCantidad: tanqueData.idChequeoCantidad,
          idBunkering: idBunkering,
          createdBy: req.usuario._id,
        });
        try {
          await nuevoTanque.save({ session });
          tanquesIds.push(nuevoTanque._id);
        } catch (tanqueErr) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            error: `Error al crear el tanque "${tanqueData.nombre}": ${tanqueErr.message}`,
          });
        }
      }
      nuevaEmbarcacion.tanques = tanquesIds;
      await nuevaEmbarcacion.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    await nuevaEmbarcacion.populate(populateOptions);

    // Filtrar tanques eliminados lógicamente
    if (Array.isArray(nuevaEmbarcacion.tanques)) {
      nuevaEmbarcacion.tanques = nuevaEmbarcacion.tanques.filter(
        (t) => !t.eliminado
      );
    }

    res.status(201).json(nuevaEmbarcacion);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error en embarcacionPost:", err);
    res.status(400).json({
      error:
        "Error al crear la embarcación y sus tanques. Verifica los datos proporcionados.",
    });
  }
};

// Actualizar una embarcación y sus tanques (PUT) - SOLO ACTUALIZA, NO DUPLICA
const embarcacionPut = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { _id, tanques, ...resto } = req.body;

  const session = await Embarcacion.startSession();
  session.startTransaction();

  try {
    const antes = await Embarcacion.findById(id)
      .populate("tanques")
      .session(session);
    if (!antes) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ msg: "Embarcación no encontrada." });
    }

    // Obtener IDs de tanques actuales en la BD
    const tanquesActualesIds = (antes.tanques || []).map((t) =>
      t._id.toString()
    );
    // Obtener IDs de tanques enviados desde el front (los que deben quedar activos)
    const tanquesEnviadosIds = Array.isArray(tanques)
      ? tanques.filter((t) => t._id).map((t) => t._id.toString())
      : [];

    // Tanques que están en la BD pero no en el front => deben marcarse como eliminados
    const tanquesParaEliminar = tanquesActualesIds.filter(
      (idTanque) => !tanquesEnviadosIds.includes(idTanque)
    );
    for (const idTanque of tanquesParaEliminar) {
      await TanqueBK.findOneAndUpdate(
        { _id: idTanque, idEmbarcacion: id, eliminado: false },
        { eliminado: true },
        { session }
      );
    }

    // Usar un nuevo array para los ids finales, solo de tanques activos
    let nuevosTanquesIds = [];
    if (Array.isArray(tanques)) {
      for (const tanqueData of tanques) {
        // ELIMINAR TANQUE LÓGICAMENTE (por bandera eliminar o eliminado: true)
        if (
          (tanqueData._id && tanqueData.eliminar === true) ||
          (tanqueData._id && tanqueData.eliminado === true)
        ) {
          await TanqueBK.findOneAndUpdate(
            { _id: tanqueData._id, idEmbarcacion: id, eliminado: false },
            { eliminado: true },
            { session }
          );
          continue;
        }

        // ACTUALIZAR TANQUE EXISTENTE
        if (
          tanqueData._id &&
          !tanqueData.eliminar &&
          tanqueData.eliminado !== true
        ) {
          // Validar duplicidad de nombre (excepto el mismo tanque)
          if (tanqueData.nombre) {
            const existe = await TanqueBK.findOne({
              nombre: tanqueData.nombre.trim(),
              idEmbarcacion: id,
              eliminado: false,
              _id: { $ne: tanqueData._id },
            }).session(session);
            if (existe) {
              await session.abortTransaction();
              session.endSession();
              return res.status(400).json({
                error: `Ya existe un tanque con el nombre "${tanqueData.nombre}" en esta embarcación.`,
              });
            }
          }
          await TanqueBK.findOneAndUpdate(
            { _id: tanqueData._id, idEmbarcacion: id, eliminado: false },
            {
              nombre: tanqueData.nombre,
              capacidad: tanqueData.capacidad,
              almacenamiento: tanqueData.almacenamiento,
              ubicacion: tanqueData.ubicacion,
              idProducto: tanqueData.idProducto,
              idEmbarcacion: id,
              idChequeoCalidad: tanqueData.idChequeoCalidad,
              idChequeoCantidad: tanqueData.idChequeoCantidad,
              idBunkering: tanqueData.idBunkering || antes.idBunkering,
            },
            { session }
          );
          nuevosTanquesIds.push(tanqueData._id);
          continue;
        }

        // CREAR NUEVO TANQUE SOLO SI NO TIENE _id
        if (!tanqueData._id) {
          // Validar duplicidad de nombre
          const existe = await TanqueBK.findOne({
            nombre: tanqueData.nombre.trim(),
            idEmbarcacion: id,
            eliminado: false,
          }).session(session);
          if (existe) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
              error: `Ya existe un tanque con el nombre "${tanqueData.nombre}" en esta embarcación.`,
            });
          }
          const nuevoTanque = new TanqueBK({
            nombre: tanqueData.nombre,
            capacidad: tanqueData.capacidad,
            almacenamiento: tanqueData.almacenamiento,
            ubicacion: tanqueData.ubicacion,
            idProducto: tanqueData.idProducto,
            idEmbarcacion: id,
            idChequeoCalidad: tanqueData.idChequeoCalidad,
            idChequeoCantidad: tanqueData.idChequeoCantidad,
            idBunkering: tanqueData.idBunkering || antes.idBunkering,
            createdBy: req.usuario._id,
          });
          try {
            await nuevoTanque.save({ session });
            nuevosTanquesIds.push(nuevoTanque._id);
          } catch (tanqueErr) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
              error: `Error al crear el tanque "${tanqueData.nombre}": ${tanqueErr.message}`,
            });
          }
        }
      }
    }

    // Solo ids de tanques activos (no eliminados)
    const tanquesActivos = await TanqueBK.find({
      idEmbarcacion: id,
      eliminado: false,
    }).session(session);
    nuevosTanquesIds = tanquesActivos.map((t) => t._id);

    const cambios = {};
    for (let key in resto) {
      if (String(antes[key]) !== String(resto[key])) {
        cambios[key] = { from: antes[key], to: resto[key] };
      }
    }
    if (Array.isArray(tanques)) {
      cambios.tanques = { from: antes.tanques, to: nuevosTanquesIds };
    }

    const embarcacionActualizada = await Embarcacion.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        ...resto,
        tanques: nuevosTanquesIds,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true, session }
    ).populate(populateOptions);

    if (!embarcacionActualizada) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ msg: "Embarcación no encontrada." });
    }

    await session.commitTransaction();
    session.endSession();

    // Filtrar tanques eliminados lógicamente
    if (Array.isArray(embarcacionActualizada.tanques)) {
      embarcacionActualizada.tanques = embarcacionActualizada.tanques.filter(
        (t) => !t.eliminado
      );
    }

    res.json(embarcacionActualizada);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error en embarcacionPut:", err);
    res.status(400).json({
      error:
        "Error al actualizar la embarcación y sus tanques. Verifica los datos proporcionados.",
    });
  }
};

// Eliminar (marcar como eliminado) una embarcación con historial de auditoría
const embarcacionDelete = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const antes = await Embarcacion.findById(id);
    if (!antes) {
      return res.status(404).json({ msg: "Embarcación no encontrada." });
    }

    const cambios = { eliminado: { from: antes.eliminado, to: true } };

    const embarcacionEliminada = await Embarcacion.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        eliminado: true,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    // Filtrar tanques eliminados lógicamente
    if (embarcacionEliminada && Array.isArray(embarcacionEliminada.tanques)) {
      embarcacionEliminada.tanques = embarcacionEliminada.tanques.filter(
        (t) => !t.eliminado
      );
    }

    if (!embarcacionEliminada) {
      return res.status(404).json({ msg: "Embarcación no encontrada." });
    }

    res.json(embarcacionEliminada);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para manejar actualizaciones parciales (PATCH)
const embarcacionPatch = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { ...resto } = req.body;

  try {
    const embarcacionActualizada = await Embarcacion.findOneAndUpdate(
      { _id: id, eliminado: false },
      { $set: resto },
      { new: true }
    ).populate(populateOptions);

    if (!embarcacionActualizada) {
      return res.status(404).json({ msg: "Embarcación no encontrada." });
    }

    // Filtrar tanques eliminados lógicamente
    if (Array.isArray(embarcacionActualizada.tanques)) {
      embarcacionActualizada.tanques = embarcacionActualizada.tanques.filter(
        (t) => !t.eliminado
      );
    }

    res.json(embarcacionActualizada);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

module.exports = {
  embarcacionesGets,
  embarcacionGet,
  embarcacionPost,
  embarcacionPut,
  embarcacionDelete,
  embarcacionPatch,
};
