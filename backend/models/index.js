const Ventana = require("./ventana");
// const BalanceBunker = require("./bunker/balanceBunker");
// const Barcaza = require("./bunker/barcaza");
const Bomba = require("./bomba");
// const Bunker = require("./bunker/bunker");
const Categoria = require("./categoria");
const ChequeoCalidad = require("./chequeoCalidad");
// const ChequeoCalidadBunker = require("./bunker/chequeoCalidadBunker");
const ChequeoCantidad = require("./chequeoCantidad");
// const ChequeoCantidadBunker = require("./bunker/chequeoCantidadBunker");
const Contacto = require("./contacto");
// const ContactoBunker = require("./bunker/contactoBunker");
const Contrato = require("./contrato");
// const ContratoBunker = require("./bunker/contratoBunker");
const Costo = require("./costo");
// const CostoBunker = require("./bunker/costoBunker");
const Despacho = require("./despacho");
const Historial = require("./historial");
const LineaCarga = require("./lineaCarga");
const LineaDespacho = require("./lineaDespacho");
// const LineaCargaBunker = require("./bunker/lineaCargaBunker");
const Producto = require("./producto");
// const ProductoBunker = require("./bunker/productoBunker");
const Recepcion = require("./recepcion");
// const RecepcionBunker = require("./bunker/recepcionBunker");
const Refineria = require("./refineria");
const Abono = require("./abono");
const Refinacion = require("./refinacion");
const RefinacionSalida = require("./refinacionSalida");
const Role = require("./role");
const Server = require("./server");
const Simulacion = require("./simulacion");
const Tanque = require("./tanque");
const TipoProducto = require("./tipoProducto");
const Torre = require("./torre");
const Usuario = require("./usuario");
const Inventario = require("./inventario");
const Partida = require("./partida");
const Operador = require("./operador");
const Factura = require("./factura");
const CorteRefinacion = require("./corteRefinacion");
const Cuenta = require("./cuenta");
const Balance = require("./balance");
const Bunkering = require("./bunkering/bunkering");
const Muelle = require("./bunkering/muelle");
const Embarcacion = require("./bunkering/embarcacion");
const TanqueBK = require("./bunkering/tanqueBK");
const RecepcionBK = require("./bunkering/recepcionBK");
const DespachoBK = require("./bunkering/despachoBK");
const lineaCargaBK = require("./bunkering/lineaCargaBK");
const lineaDespachoBK = require("./bunkering/lineaDespachoBK");
const OperadorBK = require("./bunkering/operadorBK");
const ContactoBK = require("./bunkering/contactoBK");
const ProductoBK = require("./bunkering/productoBK");
const TipoProductoBK = require("./bunkering/tipoProductoBK");
const CuentaBK = require("./bunkering/cuentaBK");
const ContratoBK = require("./bunkering/contratoBK");
const ChequeoCalidadBK = require("./bunkering/chequeoCalidadBK");
const ChequeoCantidadBK = require("./bunkering/chequeoCantidadBK");
const notification = require("./notification");

module.exports = {
  Ventana,
  // BalanceBunker,
  // Barcaza,
  Bomba,
  Categoria,
  ChequeoCalidad,
  // ChequeoCalidadBunker,
  ChequeoCantidad,
  // ChequeoCantidadBunker,
  Contacto,
  // ContactoBunker,
  Contrato,
  // ContratoBunker,
  Costo,
  Cuenta,
  // CostoBunker,
  Despacho,
  DespachoBK,
  Historial,
  LineaCarga,
  lineaCargaBK,
  LineaDespacho,
  lineaDespachoBK,
  // LineaCargaBunker,
  Producto,
  ProductoBK,
  // ProductoBunker,
  Recepcion,
  RecepcionBK,
  // RecepcionBunker,
  Refinacion,
  RefinacionSalida,
  Role,
  Server,
  Simulacion,
  Tanque,
  TipoProducto,
  TipoProductoBK,
  Torre,
  Usuario,
  Inventario,
  Partida,
  Refineria,
  Operador,
  Factura,
  CorteRefinacion,
  Bunkering,
  Muelle,
  Embarcacion,
  TanqueBK,
  OperadorBK,
  ContactoBK,
  CuentaBK,
  ContratoBK,
  ChequeoCantidadBK,
  ChequeoCalidadBK,
  Abono,
  notification,
  Balance,
};
