const { Item } = require("../models");

// Service to calculate stock value, apply price updates, and search
const itemsService = {
  async calculateStockValue(itemId) {
    // placeholder: compute total stock value across warehouses
    const stocks = await require("../stock/stock.services").getStockByItem(
      itemId
    );
    return stocks.reduce(
      (acc, s) => acc + s.cantidad * (s.costoPromedio || 0),
      0
    );
  },

  async search(query) {
    return Item.find(query).limit(50);
  },
};

module.exports = itemsService;
