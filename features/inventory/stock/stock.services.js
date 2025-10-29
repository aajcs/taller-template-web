const { Stock, Movement } = require("../models");

module.exports = {
  async getStockByItem(itemId) {
    return Stock.find({ item: itemId, eliminado: false }).populate("warehouse");
  },

  async applyMovement(movement) {
    // movement: { tipo, item, cantidad, warehouseFrom, warehouseTo, costoUnitario }
    // Basic implementation: update stock documents and record movement
    const m = new Movement(movement);
    await m.save();

    if (movement.tipo === "entrada" || movement.tipo === "ajuste") {
      // increase destination stock
      let stock = await Stock.findOne({
        item: movement.item,
        warehouse: movement.warehouseTo,
      });
      if (!stock)
        stock = new Stock({
          item: movement.item,
          warehouse: movement.warehouseTo,
          cantidad: 0,
          costoPromedio: movement.costoUnitario,
        });
      stock.cantidad = (stock.cantidad || 0) + (movement.cantidad || 0);
      await stock.save();
    }

    if (movement.tipo === "salida" || movement.tipo === "ajuste") {
      // decrease source stock
      if (movement.warehouseFrom) {
        const stockFrom = await Stock.findOne({
          item: movement.item,
          warehouse: movement.warehouseFrom,
        });
        if (stockFrom) {
          stockFrom.cantidad = Math.max(
            0,
            (stockFrom.cantidad || 0) - (movement.cantidad || 0)
          );
          await stockFrom.save();
        }
      }
    }

    return m;
  },
};
