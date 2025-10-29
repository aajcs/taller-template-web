// Importaciones necesarias
const { response, request } = require("express");
const Workshop = require("./workshop.models");

// Opciones de población para referencias en las consultas
const populateOptions = [
  { path: "createdBy", select: "nombre correo" },
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  },
];

// Controlador para obtener todos los talleres no eliminados
const workshopsGet = async (req = request, res = response, next) => {
  const query = { eliminado: false };

  try {
    // Ejecuta ambas consultas en paralelo
    const [total, workshops] = await Promise.all([
      Workshop.countDocuments(query),
      Workshop.find(query).sort({ nombre: 1 }).populate(populateOptions),
    ]);

    // Ordenar historial por fecha descendente
    workshops.forEach((workshop) => {
      if (Array.isArray(workshop.historial)) {
        workshop.historial.sort(
          (a, b) => new Date(b.fecha) - new Date(a.fecha)
        );
      }
    });

    res.json({
      total,
      workshops,
    });
  } catch (err) {
    next(err);
  }
};

// Controlador para obtener un taller específico por ID
const workshopGetById = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const workshop = await Workshop.findOne({
      _id: id,
      eliminado: false,
    }).populate(populateOptions);

    if (!workshop) {
      return res.status(404).json({ msg: "Taller no encontrado" });
    }

    // Ordenar historial por fecha descendente
    if (Array.isArray(workshop.historial)) {
      workshop.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }

    res.json(workshop);
  } catch (err) {
    next(err);
  }
};

// Controlador para crear un nuevo taller
const workshopPost = async (req = request, res = response, next) => {
  const { ubicacion, procesamientoDia, nombre, legal, telefono, rif, img } =
    req.body;

  try {
    // Crear nueva instancia del taller
    const newWorkshop = new Workshop({
      ubicacion,
      procesamientoDia,
      nombre,
      legal,
      telefono,
      rif,
      img,
      createdBy: req.usuario?._id, // Usuario que crea el registro
    });

    // Guardar en la base de datos
    await newWorkshop.save();

    res.status(201).json(newWorkshop);
  } catch (err) {
    next(err);
  }
};

// Controlador para actualizar un taller existente
const workshopPut = async (req = request, res = response, next) => {
  const { id } = req.params;
  const {
    ubicacion,
    procesamientoDia,
    nombre,
    legal,
    telefono,
    rif,
    img,
    estado,
  } = req.body;

  try {
    // Buscar el taller existente
    const workshop = await Workshop.findOne({ _id: id, eliminado: false });

    if (!workshop) {
      return res.status(404).json({ msg: "Taller no encontrado" });
    }

    // Actualizar campos
    const updatedData = {
      ubicacion,
      procesamientoDia,
      nombre,
      legal,
      telefono,
      rif,
      img,
      estado,
    };

    // Filtrar campos undefined
    Object.keys(updatedData).forEach(
      (key) => updatedData[key] === undefined && delete updatedData[key]
    );

    // Actualizar el taller
    const workshopActualizado = await Workshop.findByIdAndUpdate(
      id,
      updatedData,
      {
        new: true, // Devuelve el documento actualizado
        runValidators: true, // Ejecuta validaciones del schema
      }
    ).populate(populateOptions);

    res.json(workshopActualizado);
  } catch (err) {
    next(err);
  }
};

// Controlador para eliminar lógicamente un taller
const workshopDelete = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    // Buscar el taller
    const workshop = await Workshop.findById(id);

    if (!workshop) {
      return res.status(404).json({ msg: "Taller no encontrado" });
    }

    if (workshop.eliminado) {
      return res.status(400).json({ msg: "El taller ya fue eliminado" });
    }

    // Marcar como eliminado
    workshop.eliminado = true;
    await workshop.save();

    res.json({ msg: "Taller eliminado correctamente", workshop });
  } catch (err) {
    next(err);
  }
};

// Controlador para PATCH (método no implementado)
const workshopPatch = (req = request, res = response) => {
  res.status(501).json({
    msg: "Método PATCH no implementado",
  });
};

// Exportar todos los controladores
module.exports = {
  workshopsGet,
  workshopGetById,
  workshopPost,
  workshopPut,
  workshopDelete,
  workshopPatch,
};
