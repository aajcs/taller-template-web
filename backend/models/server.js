const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const admin = require("firebase-admin");

const { dbConnection } = require("../database/config");
const Sockets = require("./sockets");
const errorHandler = require("../middlewares/error-handler");
// const tipoProductoBK = require("./bunkering/tipoProductoBK");
// const productoBK = require("./bunkering/productoBK");asdas

// Inicializa Firebase Admin solo si no está inicializado
if (!admin.apps.length) {
  // const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT;

    // Definición de rutas
    this.paths = {
      auth: "/api/auth",
      buscar: "/api/buscar",
      balance: "/api/balance",
      categorias: "/api/categorias",
      producto: "/api/producto",
      usuarios: "/api/usuarios",
      uploads: "/api/uploads",
      refinerias: "/api/refinerias",
      lineaCarga: "/api/lineaCarga",
      lineaDespacho: "/api/lineaDespacho",
      bomba: "/api/bomba",
      tanque: "/api/tanque",
      torre: "/api/torre",
      contrato: "/api/contrato",
      contacto: "/api/contacto",
      recepcion: "/api/recepcion",
      refinacion: "/api/refinacion",
      despacho: "/api/despacho",
      chequeoCalidad: "/api/chequeoCalidad",
      chequeoCantidad: "/api/chequeoCantidad",
      historial: "/api/historial",
      costo: "/api/costo",
      refinacionSalida: "/api/refinacionSalida",
      ventana: "/api/ventana",
      tipoProducto: "/api/tipoProducto",
      simulacion: "/api/simulacion",
      inventario: "/api/inventario",
      partida: "/api/partida",
      operador: "/api/operador",
      factura: "/api/factura",
      corteRefinacion: "/api/corteRefinacion",
      cuenta: "/api/cuenta",
      abono: "/api/abono",
      lineaFactura: "/api/lineaFactura",
      // bunker: "/api/bunker/bunker",
      // balanceBunker: "/api/bunker/balanceBunker",
      // barcaza: "/api/bunker/barcaza",
      // chequeoCalidadBunker: "/api/bunker/ChequeoCalidadBunker",
      // chequeoCantidadBunker: "/api/bunker/chequeoCantidadBunker",
      // productoBunker: "/api/bunker/productoBunker",
      // contratoBunker: "/api/bunker/contratoBunker",
      // contactoBunker: "/api/bunker/contactoBunker",
      // recepcionBunker: "/api/bunker/recepcionBunker",
      // costoBunker: "/api/bunker/costoBunker",
      // lineaCargaBunker: "/api/bunker/lineaCargaBunker",

      // Agregar más rutas según sea necesario
      bunkering: "/api/bunkering/bunkering",
      muelle: "/api/bunkering/muelleBK",
      recepcionBK: "/api/bunkering/recepcionBK",
      despachoBK: "/api/bunkering/despachoBK",
      lineaCargaBK: "/api/bunkering/lineaCargaBK",
      embarcacion: "/api/bunkering/embarcacionBK",
      tanqueBK: "/api/bunkering/tanqueBK",
      lineaDespachoBK: "/api/bunkering/lineaDespachoBK",
      operadorBK: "/api/bunkering/operadorBK",
      contactoBK: "/api/bunkering/contactoBK",
      productoBK: "/api/bunkering/productoBK",
      tipoProductoBK: "/api/bunkering/tipoProductoBK",
      cuentaBK: "/api/bunkering/cuentaBK",
      contratoBK: "/api/bunkering/contratoBK",
      chequeoCantidadBK: "/api/bunkering/chequeoCantidadBK",
      chequeoCalidadBK: "/api/bunkering/chequeoCalidadBK",
      notification: "/api/notification",
    };

    // Conectar a base de datos
    this.conectarDB();

    // Middlewares
    this.middlewares();

    // Crear servidor HTTP
    this.server = http.createServer(this.app);

    // Configuración de sockets
    this.io = socketio(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
      transports: ["websocket", "polling"], // Acepta WebSocket y polling
    });

    // Middleware para inyectar sockets en las solicitudes
    this.app.use((req, res, next) => {
      req.io = this.io;
      next();
    });

    // Rutas de la aplicación
    this.routes();
    this.app.use(errorHandler);
  }

  async conectarDB() {
    await dbConnection();
  }

  middlewares() {
    // CORS
    this.app.use(
      cors({
        origin: "*", // o el dominio de tu frontss
        exposedHeaders: ["X-New-Token"],
      })
    );

    // Lectura y parseo del body
    this.app.use(express.json());

    // Directorio Público
    this.app.use(express.static("public"));

    // Fileupload - Carga de archivos
    this.app.use(
      fileUpload({
        useTempFiles: true,
        tempFileDir: "/tmp/",
        createParentPath: true,
      })
    );
  }

  routes() {
    // Rutas de autenticación y usuarios
    this.app.use(this.paths.auth, require("../routes/auth"));
    this.app.use(this.paths.usuarios, require("../routes/usuarios"));

    // Rutas de gestión general
    this.app.use(this.paths.ventana, require("../routes/ventana"));
    this.app.use(this.paths.buscar, require("../routes/buscar"));
    this.app.use(this.paths.categorias, require("../routes/categorias"));
    this.app.use(this.paths.costo, require("../routes/costo"));
    this.app.use(this.paths.historial, require("../routes/historial"));
    this.app.use(this.paths.producto, require("../routes/producto"));
    this.app.use(this.paths.tipoProducto, require("../routes/tipoProducto"));
    this.app.use(this.paths.simulacion, require("../routes/simulacion"));
    this.app.use(this.paths.inventario, require("../routes/inventario"));
    this.app.use(this.paths.partida, require("../routes/partida"));
    this.app.use(this.paths.cuenta, require("../routes/cuenta"));

    // Rutas relacionadas con el módulo de cuentas
    this.app.use(this.paths.operador, require("../routes/operador"));

    // Rutas relacionadas con el módulo de finanzas
    this.app.use(this.paths.factura, require("../routes/factura"));
    this.app.use(this.paths.balance, require("../routes/balance"));
    this.app.use(this.paths.abono, require("../routes/abono"));
    this.app.use(this.paths.lineaFactura, require("../routes/lineaFactura"));

    // Rutas relacionadas con operaciones de calidad y cantidad
    this.app.use(
      this.paths.chequeoCalidad,
      require("../routes/chequeoCalidad")
    );
    this.app.use(
      this.paths.chequeoCantidad,
      require("../routes/chequeoCantidad")
    );

    // Rutas específicas de refinación y despacho
    this.app.use(this.paths.despacho, require("../routes/despacho"));
    this.app.use(this.paths.recepcion, require("../routes/recepcion"));
    this.app.use(this.paths.refinacion, require("../routes/refinacion"));
    this.app.use(
      this.paths.refinacionSalida,
      require("../routes/refinacionSalida")
    );
    this.app.use(this.paths.refinerias, require("../routes/refinerias"));
    this.app.use(
      this.paths.corteRefinacion,
      require("../routes/corteRefinacion")
    );

    // Rutas de infraestructura
    this.app.use(this.paths.bomba, require("../routes/bomba"));
    this.app.use(this.paths.lineaCarga, require("../routes/lineaCarga"));
    this.app.use(this.paths.lineaDespacho, require("../routes/lineaDespacho"));
    this.app.use(this.paths.tanque, require("../routes/tanque"));
    this.app.use(this.paths.torre, require("../routes/torre"));

    // Rutas relacionadas con contactos y contratos
    this.app.use(this.paths.contacto, require("../routes/contacto"));
    this.app.use(this.paths.contrato, require("../routes/contrato"));

    // Rutas de archivos y cargas
    this.app.use(this.paths.uploads, require("../routes/uploads"));

    // Rutas de bunkering
    this.app.use(
      this.paths.bunkering,
      require("../routes/bunkering/bunkering")
    );
    this.app.use(this.paths.muelle, require("../routes/bunkering/muelle"));
    this.app.use(
      this.paths.embarcacion,
      require("../routes/bunkering/embarcacion")
    );
    this.app.use(this.paths.tanqueBK, require("../routes/bunkering/tanqueBK"));
    this.app.use(
      this.paths.lineaCargaBK,
      require("../routes/bunkering/lineaCargaBK")
    );
    this.app.use(
      this.paths.lineaDespachoBK,
      require("../routes/bunkering/lineaDespachoBK")
    );
    this.app.use(
      this.paths.recepcionBK,
      require("../routes/bunkering/recepcionBK")
    );
    this.app.use(
      this.paths.despachoBK,
      require("../routes/bunkering/despachoBK")
    );
    this.app.use(
      this.paths.productoBK,
      require("../routes/bunkering/productoBK")
    );
    this.app.use(
      this.paths.tipoProductoBK,
      require("../routes/bunkering/tipoProductoBK")
    );
    this.app.use(
      this.paths.contactoBK,
      require("../routes/bunkering/contactoBK")
    );
    this.app.use(this.paths.cuentaBK, require("../routes/bunkering/cuentaBK"));

    this.app.use(
      this.paths.contratoBK,
      require("../routes/bunkering/contratoBK")
    );

    this.app.use(
      this.paths.chequeoCantidadBK,
      require("../routes/bunkering/chequeoCantidadBK")
    );
    this.app.use(
      this.paths.chequeoCalidadBK,
      require("../routes/bunkering/chequeoCalidadBK")
    );
    this.app.use(this.paths.notification, require("../routes/notification"));

    // Rutas FCM
    this.app.post("/api/send-notification", async (req, res) => {
      try {
        const { token, title, body } = req.body;
        const message = {
          token,
          notification: { title, body },
          webpush: {
            fcmOptions: {
              link: "https://tudominio.com",
            },
          },
        };
        await admin.messaging().send(message);
        res.status(200).json({ success: true });
      } catch (error) {
        console.error("Error sending notification:", error);
        res.status(500).json({ error: error.message });
      }
    });
    // this.app.post("/api/save-token", (req, res) => {
    //   const { token } = req.body;
    //   // Aquí deberías guardar el token en tu base de datos
    //   console.log("Token recibido:", token);
    //   res.status(200).send("Token guardado");
    // });
    // this.app.use("/api/send-notification", require("../routes/fcm")); // Asume que tienes un router para FCM
    this.app.use("/api/save-token", require("../routes/notificationToken")); // Router dedicado para guardar tokens
    // Rutas específicas del módulo Bunker
    // const bunkerRoutes = "../routes/bunker";
    // this.app.use(this.paths.bunker, require(`${bunkerRoutes}/bunker`));
    // this.app.use(
    //   this.paths.balanceBunker,
    //   require(`${bunkerRoutes}/balanceBunker`)
    // );
    // this.app.use(this.paths.barcaza, require(`${bunkerRoutes}/barcaza`));
    // this.app.use(
    //   this.paths.chequeoCalidadBunker,
    //   require(`${bunkerRoutes}/chequeoCalidadBunker`)
    // );
    // this.app.use(
    //   this.paths.chequeoCantidadBunker,
    //   require(`${bunkerRoutes}/chequeoCantidadBunker`)
    // );
    // this.app.use(
    //   this.paths.contactoBunker,
    //   require(`${bunkerRoutes}/contactoBunker`)
    // );
    // this.app.use(
    //   this.paths.contratoBunker,
    //   require(`${bunkerRoutes}/contratoBunker`)
    // );
    // this.app.use(
    //   this.paths.costoBunker,
    //   require(`${bunkerRoutes}/costoBunker`)
    // );

    // this.app.use(
    //   this.paths.lineaCargaBunker,
    //   require(`${bunkerRoutes}/lineaCargaBunker`)
    // );
    // this.app.use(
    //   this.paths.productoBunker,
    //   require(`${bunkerRoutes}/productoBunker`)
    // );
    // this.app.use(
    //   this.paths.recepcionBunker,
    //   require(`${bunkerRoutes}/recepcionBunker`)
    // );
  }

  configurarSockets() {
    new Sockets(this.io);
  }

  listen() {
    // Inicializar sockets
    this.configurarSockets();
    this.server.listen(this.port, () => {
      console.log("Servidor corriendo en puerto", this.port);
    });
  }
}

module.exports = Server;
