/**
 * Finance Feature - Index
 * Gestión financiera: facturas, abonos, balance, costos
 */

// Cuando migres los archivos de finanzas aquí, descomenta y ajusta:
// module.exports = require('./finance.routes');

// Por ahora, re-exporta las rutas actuales como wrappers
module.exports = {
  factura: require("../../routes/factura"),
  abono: require("../../routes/abono"),
  balance: require("../../routes/balance"),
  lineaFactura: require("../../routes/lineaFactura"),
  costo: require("../../routes/costo"),
  cuenta: require("../../routes/cuenta"),
};
