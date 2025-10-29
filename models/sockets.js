const { comprobarJWT } = require("../helpers/jwt");
const {
  userConnected,
  userDisconnected,
  // grabarMensaje,
  getUsers,
} = require("../controllers/sockets");

class Sockets {
  constructor(io) {
    this.io = io;

    this.socketEvents();
  }

  socketEvents() {
    // On connection
    this.io.on("connection", async (socket) => {
      const [valido, id] = comprobarJWT(socket.handshake.query["x-token"]);
      if (!valido) {
        console.log("socket no identificado");
        return socket.disconnect();
      }

      // Mark user as connected
      const user = await userConnected(id);
      console.log("Cliente conectado:", user.nombre);

      // Join the user to their specific room
      socket.join(`user-${id}`);
      console.log(`Usuario unido a la sala: user-${id}`);

      // Emit a welcome message to the user
      socket.emit("welcome", `Bienvenido, ${user.nombre}`);

      // Listen for custom events (e.g., join-user-room)
      socket.on("join-user-room", (userId) => {
        socket.join(`user-${userId}`);
        console.log(`Usuario unido a la sala: user-${userId}`);
      });

      // Unir al usuario a una sala de socket.io
      // socket.join(id);

      // TODO: Validar el JWT
      // Si el token no es válido, desconectar

      // TODO: Saber que usuario está activo mediante el id

      // TODO: Emitir todos los usuarios conectados
      // this.io.emit("mensaje", "Hola me conecte");

      // TODO: Socket join, id

      // TODO: Escuchar cuando el cliente manda un mensaje
      // socket.on( 'mensaje-personal', async( payload ) => {
      //     const mensaje = await grabarMensaje( payload );
      //     this.io.to( payload.para ).emit( 'mensaje-personal', mensaje );
      //     this.io.to( payload.de ).emit( 'mensaje-personal', mensaje );
      // });

      // TODO: Disconnect
      // Marcar en la BD que el usuario se desconecto
      // TODO: Emitir todos los usuarios conectados
      socket.on("disconnect", async () => {
        await userDisconnected(id);
        console.log("Cliente desconectado", id);
        this.io.emit("mensaje-from-server");
      });
    });
  }
}

module.exports = Sockets;
