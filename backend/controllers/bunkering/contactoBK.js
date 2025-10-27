const { response, request } = require("express");
const ContactoBK = require("../../models/bunkering/contactoBK");

// Opciones de población reutilizables para consultas
const populateOptions = [
  { path: "idBunkering", select: "nombre" },
  { path: "createdBy", select: "nombre correo" },
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  },
];

// Obtener todos los contactos
const contactoGets = async (req = request, res = response, next) => {
  const query = { eliminado: false };

  try {
    const [total, contactos] = await Promise.all([
      ContactoBK.countDocuments(query),
      ContactoBK.find(query).populate(populateOptions),
    ]);

    // Ordenar historial por fecha descendente en cada contacto
    contactos.forEach((c) => {
      if (Array.isArray(c.historial)) {
        c.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });

    res.json({ total, contactos });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Obtener un contacto específico por ID
const contactoGet = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const contacto = await ContactoBK.findOne({
      _id: id,
      eliminado: false,
    }).populate(populateOptions);

    if (!contacto) {
      return res.status(404).json({ msg: "Contacto no encontrado" });
    }

    // Ordenar historial por fecha descendente
    if (Array.isArray(contacto.historial)) {
      contacto.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }

    res.json(contacto);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Crear un nuevo contacto
const contactoPost = async (req = request, res = response, next) => {
  const {
    idBunkering,
    nombre,
    ciudad,
    identificacionFiscal,
    representanteLegal,
    telefono,
    correo,
    email,
    direccion,
    tipo,
    cuentasBancarias,
    cuentasPorPagar,
    cuentasPorCobrar,
    compras,
    ventas,
  } = req.body;

  try {
    const nuevoContacto = new ContactoBK({
      idBunkering,
      nombre,
      ciudad,
      identificacionFiscal,
      representanteLegal,
      telefono,
      correo,
      email,
      direccion,
      tipo,
      cuentasBancarias,
      cuentasPorPagar,
      cuentasPorCobrar,
      compras,
      ventas,
      createdBy: req.usuario._id,
    });

    await nuevoContacto.save();
    await nuevoContacto.populate(populateOptions);

    res.status(201).json(nuevoContacto);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Actualizar un contacto existente con historial de modificaciones
const contactoPut = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { _id, ...resto } = req.body;

  try {
    const antes = await ContactoBK.findById(id);
    if (!antes) {
      return res.status(404).json({ msg: "Contacto no encontrado" });
    }

    const cambios = {};
    for (let key in resto) {
      if (String(antes[key]) !== String(resto[key])) {
        cambios[key] = { from: antes[key], to: resto[key] };
      }
    }

    const contactoActualizado = await ContactoBK.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        ...resto,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    if (!contactoActualizado) {
      return res.status(404).json({ msg: "Contacto no encontrado" });
    }

    res.json(contactoActualizado);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Eliminar (marcar como eliminado) un contacto con historial de auditoría
const contactoDelete = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const antes = await ContactoBK.findById(id);
    if (!antes) {
      return res.status(404).json({ msg: "Contacto no encontrado" });
    }

    const cambios = { eliminado: { from: antes.eliminado, to: true } };

    const contactoEliminado = await ContactoBK.findOneAndUpdate(
      { _id: id, eliminado: false },
      {
        eliminado: true,
        $push: { historial: { modificadoPor: req.usuario._id, cambios } },
      },
      { new: true }
    ).populate(populateOptions);

    if (!contactoEliminado) {
      return res.status(404).json({ msg: "Contacto no encontrado" });
    }

    res.json(contactoEliminado);
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

module.exports = {
  contactoGets,
  contactoGet,
  contactoPost,
  contactoPut,
  contactoDelete,
};
