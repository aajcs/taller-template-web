const { Router } = require("express");

const router = Router();

// Mount sub-routers
router.use("/items", require("./items/items.routes"));
router.use("/stock", require("./stock/stock.routes"));
router.use("/suppliers", require("./suppliers/suppliers.routes"));
router.use("/warehouses", require("./warehouses/warehouses.routes"));
router.use("/movements", require("./movements/movements.routes"));
router.use("/orders", require("./orders/orders.routes"));
router.use("/reservations", require("./reservations/reservations.routes"));

// Catalogs
router.use("/brands", require("./brands/brands.routes"));
router.use("/categories", require("./categories/categories.routes"));
// Catalogs
router.use("/brands", require("./brands/brands.routes"));
router.use("/categories", require("./categories/categories.routes"));
// models subfeature (moved from itemModels)
router.use("/models", require("./models/models.routes"));

module.exports = router;
