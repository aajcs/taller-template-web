const Role = require("../models/role");
const {
  Usuario,
  Balance,
  Abono,
  Categoria,
  Producto,
  Refineria,
  LineaCarga,
  LineaDespacho,
  Tanque,
  Bomba,
  Torre,
  Contrato,
  Contacto,
  Recepcion,
  Refinacion,
  ChequeoCalidad,
  ChequeoCantidad,
  Historial,
  Costo,
  RefinacionSalida,
  Ventana,
  TipoProducto,
  Simulacion,
  Despacho,
  Partida,
  Factura,
  CorteRefinacion,
  Muelle,
  Bunkering,
  Embarcacion,
  TanqueBK,
  ContactoBK,
  TipoProductoBK,
  ProductoBK,
  ContratoBK,
  RecepcionBK,
  LineaCargaBK,
  DespachoBK,
  LineaFactura,
} = require("../models");

const esRoleValido = async (rol = "USER_ROLE") => {
  const existeRol = await Role.findOne({ rol });
  if (!existeRol) {
    throw new Error(`El rol ${rol} no está registrado en la BD`);
  }
};

const emailExiste = async (correo = "") => {
  // Verificar si el correo existe
  const existeEmail = await Usuario.findOne({ correo });
  if (existeEmail) {
    throw new Error(`El correo: ${correo}, ya está registrado`);
  }
};
const nitExiste = async (nit = "") => {
  // Verificar si el nit existe
  const nitExiste = await Refineria.findOne({ nit });
  if (nitExiste) {
    throw new Error(`El nit: ${nit}, ya está registrado`);
  }
};

const existeUsuarioPorId = async (id) => {
  // Verificar si el correo existe
  const existeUsuario = await Usuario.findById(id);
  if (!existeUsuario) {
    throw new Error(`El id no existe ${id}`);
  }
};

const existeRefineriaPorId = async (id) => {
  // Verificar si la refineria existe
  const existeRefineria = await Refineria.findById(id);
  if (!existeRefineria) {
    throw new Error(`La refineria no existe ${id}`);
  }
};

const existeLineaPorId = async (id) => {
  // Verificar si la linea existe

  const existeLinea = await LineaCarga.findById(id);
  if (!existeLinea) {
    throw new Error(`El id no existe ${id}`);
  }
};
const existeLineaDespachoPorId = async (id) => {
  // Verificar si la linea existe

  const existeLineaDespacho = await LineaDespacho.findById(id);
  if (!existeLineaDespacho) {
    throw new Error(`El id no existe ${id}`);
  }
};

const existeBombaPorId = async (id) => {
  // Verificar si la Bomba existe
  const existeBomba = await Bomba.findById(id);
  if (!existeBomba) {
    throw new Error(`El id no existe ${id}`);
  }
};

const existeBalancePorId = async (id) => {
  // Verificar si la Balance existe
  const existeBalance = await Balance.findById(id);
  if (!existeBalance) {
    throw new Error(`El id no existe ${id}`);
  }
};

const existeTanquePorId = async (id) => {
  // Verificar si el Tanque existe
  const existeTanque = await Tanque.findById(id);
  if (!existeTanque) {
    throw new Error(`El id de Tanque no existe ${id}`);
  }
};

const existeTanqueBKPorId = async (id) => {
  // Verificar si el Tanque existe
  const existeTanqueBK = await TanqueBK.findById(id);
  if (!existeTanqueBK) {
    throw new Error(`El id de Tanque no existe ${id}`);
  }
};

const existeTorrePorId = async (id) => {
  // Verificar si torre existe
  const existeTorre = await Torre.findById(id);
  if (!existeTorre) {
    throw new Error(`El id de Torre no existe ${id}`);
  }
};

const existeContratoPorId = async (id) => {
  // Verificar si contrato existe
  const existeContrato = await Contrato.findById(id);
  if (!existeContrato) {
    throw new Error(`El id no existe ${id}`);
  }
};

const existeAbonoPorId = async (id) => {
  // Verificar si contrato existe
  const existeAbono = await Abono.findById(id);
  if (!existeAbono) {
    throw new Error(`El id no existe ${id}`);
  }
};

const existeRecepcionPorId = async (id) => {
  // Verificar si la linea existe
  const existeRecepcion = await Recepcion.findById(id);
  if (!existeRecepcion) {
    throw new Error(`El id no existe ${id}`);
  }
};
const existeDespachoPorId = async (id) => {
  // Verificar si la linea existe
  const existeDespacho = await Despacho.findById(id);
  if (!existeDespacho) {
    throw new Error(`El id no existe ${id}`);
  }
};

const existeContactoPorId = async (id) => {
  // Verificar si contacto existe
  const existeContacto = await Contacto.findById(id);
  if (!existeContacto) {
    throw new Error(`El id no existe ${id}`);
  }
};
/**
 * Categorias
 */
const existeCategoriaPorId = async (id) => {
  // Verificar si el correo existe
  const existeCategoria = await Categoria.findById(id);
  if (!existeCategoria) {
    throw new Error(`El id no existe ${id}`);
  }
};

/**
 * Productos
 */
const existeProductoPorId = async (id) => {
  // Verificar si el correo existe
  const existeProducto = await Producto.findById(id);
  if (!existeProducto) {
    throw new Error(`El id no existe ${id}`);
  }
};
const existeProductoBKPorId = async (id) => {
  // Verificar si el correo existe
  const existeProducto = await ProductoBK.findById(id);
  if (!existeProducto) {
    throw new Error(`El id no existe ${id}`);
  }
};

const existeCostoPorId = async (id) => {
  // Verificar si el correo existe
  const existeCosto = await Costo.findById(id);
  if (!existeCosto) {
    throw new Error(`El id no existe ${id}`);
  }
};

const existeRefinacionPorId = async (id) => {
  // Verificar si refinacion existe
  const existeRefinacion = await Refinacion.findById(id);
  if (!existeRefinacion) {
    throw new Error(`El id no existe ${id}`);
  }
};
const existeChequeoCalidadPorId = async (id) => {
  // Verificar si la refineria existe

  const existeChequeoCalidad = await ChequeoCalidad.findById(id);
  if (!existeChequeoCalidad) {
    throw new Error(`El chequeo no existe ${id}`);
  }
};
const existeChequeoCantidadPorId = async (id) => {
  // Verificar si la refineria existe

  const existeChequeoCantidad = await ChequeoCantidad.findById(id);
  if (!existeChequeoCantidad) {
    throw new Error(`El chequeo no existe ${id}`);
  }
};

const existeHistorialPorId = async (id) => {
  // Verificar si la refineria existe

  const existeHistorial = await Historial.findById(id);
  if (!existeHistorial) {
    throw new Error(`El chequeo no existe ${id}`);
  }
};

const existeRefinacionSalidaPorId = async (id) => {
  // Verificar si la refineria existe

  const existeRefinacionSalida = await RefinacionSalida.findById(id);
  if (!existeRefinacionSalida) {
    throw new Error(`Refinacion no existe ${id}`);
  }
};

const existeVentanaPorId = async (id) => {
  // Verificar si la refineria existe

  const existeVentana = await Ventana.findById(id);
  if (!existeVentana) {
    throw new Error(`Ventana no existe ${id}`);
  }
};

const existeTipoProductoPorId = async (id) => {
  // Verificar si la refineria existe

  const existeTipoProducto = await TipoProducto.findById(id);
  if (!existeTipoProducto) {
    throw new Error(`Tipo de Producto no existe ${id}`);
  }
};
const existeTipoProductoBKPorId = async (id) => {
  // Verificar si la refineria existe
  const existeTipoProducto = await TipoProductoBK.findById(id);
  if (!existeTipoProducto) {
    throw new Error(`Tipo de Producto no existe ${id}`);
  }
};

const existeSimulacionPorId = async (id) => {
  // Verificar si la simulacion existe

  const existeSimulacion = await Simulacion.findById(id);
  if (!existeSimulacion) {
    throw new Error(`Simulacion no existe ${id}`);
  }
};

const existeFacturaPorId = async (id) => {
  // Verificar si la simulacion existe

  const existeFactura = await Factura.findById(id);
  if (!existeFactura) {
    throw new Error(`Factura no existe ${id}`);
  }
};

const existeLineaFacturaPorId = async (id) => {
  // Verificar si la simulacion existe

  const existeLineaFactura = await LineaFactura.findById(id);
  if (!existeLineaFactura) {
    throw new Error(`LineaFactura no existe ${id}`);
  }
};

const existePartidaPorId = async (id) => {
  // Verificar si la simulacion existe

  const existePartida = await Partida.findById(id);
  if (!existePartida) {
    throw new Error(`Partida no existe ${id}`);
  }
};

const existeCorteRefinacionPorId = async (id) => {
  // Verificar si la corte existe
  const existeCorteRefinacion = await CorteRefinacion.findById(id);
  if (!existeCorteRefinacion) {
    throw new Error(`El id no existe ${id}`);
  }
};

const existeMuellePorId = async (id) => {
  // Verificar si la corte existe
  const existeMuelle = await Muelle.findById(id);
  if (!existeMuelle) {
    throw new Error(`El id no existe ${id}`);
  }
};

const existeOperadorBKPorId = async (id) => {
  // Verificar si la corte existe
  const existeOperadorBK = await OperadorBK.findById(id);
  if (!existeOperadorBK) {
    throw new Error(`El id no existe ${id}`);
  }
};

const existeLineaCargaBKPorId = async (id) => {
  // Verificar si la corte existe
  const existeLineaCargaBK = await LineaCargaBK.findById(id);
  if (!existeLineaCargaBK) {
    throw new Error(`El id no existe ${id}`);
  }
};

const existeContactoBKPorId = async (id) => {
  // Verificar si contacto existe
  const existeContactoBK = await ContactoBK.findById(id);
  if (!existeContactoBK) {
    throw new Error(`El id no existe ${id}`);
  }
};
const existeContratoBKPorId = async (id) => {
  // Verificar si contacto existe
  const existeContratoBK = await ContratoBK.findById(id);
  if (!existeContratoBK) {
    throw new Error(`El id no existe ${id}`);
  }
};

const existeRecepcionBKPorId = async (id) => {
  // Verificar si contacto existe
  const existeRecepcionBK = await RecepcionBK.findById(id);
  if (!existeRecepcionBK) {
    throw new Error(`El id no existe ${id}`);
  }
};

const existeDespachoBKPorId = async (id) => {
  // Verificar si contacto existe
  const existeDespachoBK = await DespachoBK.findById(id);
  if (!existeDespachoBK) {
    throw new Error(`El id no existe ${id}`);
  }
};
const existeBunkeringPorId = async (id) => {
  //Verificar si el bunkering existe
  const existeBunkering = await Bunkering.findById(id);
  if (!existeBunkering) {
    throw new Error(`El id no existe ${id}`);
  }
};

const existeEmbarcacionPorId = async (id) => {
  //Verificar si la embarcacion existe
  const existeEmbarcacion = await Embarcacion.findById(id);
  if (!existeEmbarcacion) {
    throw new Error(`El id no existe ${id}`);
  }
};

/**
 * Validar colecciones permitidas
 */
const coleccionesPermitidas = (coleccion = "", colecciones = []) => {
  const incluida = colecciones.includes(coleccion);
  if (!incluida) {
    throw new Error(
      `La colección ${coleccion} no es permitida, ${colecciones}`
    );
  }
  return true;
};

module.exports = {
  esRoleValido,
  emailExiste,
  existeUsuarioPorId,
  existeCategoriaPorId,
  existeProductoPorId,
  coleccionesPermitidas,
  nitExiste,
  existeRefineriaPorId,
  existeLineaPorId,
  existeBombaPorId,
  existeTanquePorId,
  existeTorrePorId,
  existeContratoPorId,
  existeContactoPorId,
  existeRecepcionPorId,
  existeRefinacionPorId,
  existeChequeoCalidadPorId,
  existeChequeoCantidadPorId,
  existeHistorialPorId,
  existeCostoPorId,
  existeRefinacionSalidaPorId,
  existeVentanaPorId,
  existeTipoProductoPorId,
  existeSimulacionPorId,
  existeLineaDespachoPorId,
  existeDespachoPorId,
  existePartidaPorId,
  existeFacturaPorId,
  existeLineaFacturaPorId,
  existeCorteRefinacionPorId,
  existeBalancePorId,
  existeMuellePorId,
  existeBunkeringPorId,
  existeEmbarcacionPorId,
  existeTanqueBKPorId,
  existeOperadorBKPorId,
  existeContactoBKPorId,
  existeContratoBKPorId,
  existeTipoProductoBKPorId,
  existeProductoBKPorId,
  existeRecepcionBKPorId,
  existeLineaCargaBKPorId,
  existeDespachoBKPorId,
  existeAbonoPorId,
};

// SENTENCIA QUE NOS PERMITE DEJAR UN CAMPO VACIO
// if (id === undefined) {
//   return true;
// }
