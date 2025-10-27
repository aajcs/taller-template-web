const mongoose = require("mongoose");

const clientOptions = {
  serverApi: { version: "1", strict: true, deprecationErrors: true },
};

const dbConnection = async () => {
  try {
    // Create a Mongoose client with a MongoClientOptions object to set the Stable API version
    await mongoose.connect(process.env.MONGODB_CNN, clientOptions);
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log(
      "¡Se ha realizado un ping a tu despliegue. Te has conectado exitosamente a MongoDB!"
    );
  } catch (error) {
    console.log(error);
    throw new Error("Error a la hora de iniciar la base de datos");
  }
};

module.exports = { dbConnection };

// Execute the dbConnection function if this file is dbConnection directly
if (require.main === module) {
  dbConnection().catch(console.dir);
}
