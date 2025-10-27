// const { Schema, model } = require("mongoose");

// const CounterSchema = new Schema({
//   _id: String,
//   seq: { type: Number, default: 1000 }, // Valor inicial en 1000
// });

// module.exports = model("Counter", CounterSchema);
const { Schema, model } = require("mongoose");

const CounterSchema = new Schema({
  _id: String,
  seq: { type: Number, default: 999 }, // Valor inicial en 1000
});

module.exports = model("Counter", CounterSchema);
