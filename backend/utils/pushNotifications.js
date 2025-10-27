// // utils/pushNotifications.js
// import admin from "firebase-admin";

// // Inicializar Firebase Admin (solo una vez)
// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert({
//       projectId: process.env.FIREBASE_PROJECT_ID,
//       clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
//       privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
//     }),
//   });
// }

// export async function sendPushNotification(deviceToken, message) {
//   try {
//     // Validar el token del dispositivo
//     if (!deviceToken || typeof deviceToken !== "string") {
//       console.error("Token de dispositivo inválido:", deviceToken);
//       return;
//     }

//     // Configurar el mensaje
//     const payload = {
//       notification: {
//         title: "Nueva notificación",
//         body: message,
//         icon: "/notification-icon.png",
//         click_action: "https://tudominio.com/notifications",
//       },
//       data: {
//         // Datos adicionales que quieras enviar
//         type: "new_message",
//         id: "123",
//         deep_link: "/messages/123",
//       },
//       token: deviceToken,
//       webpush: {
//         // Configuración específica para navegadores
//         fcm_options: {
//           link: "https://tudominio.com/notifications",
//         },
//         headers: {
//           // Importante para macOS/Chrome
//           Urgency: "high",
//         },
//       },
//     };

//     // Enviar la notificación
//     const response = await admin.messaging().send(payload);
//     console.log("Notificación enviada con éxito:", response);
//     return response;
//   } catch (error) {
//     console.error("Error enviando notificación push:", error);

//     // Manejar errores específicos
//     if (
//       error.errorInfo &&
//       error.errorInfo.code === "messaging/invalid-registration-token"
//     ) {
//       console.warn("Token inválido, eliminando:", deviceToken);
//       // Aquí deberías eliminar el token de tu base de datos
//     }

//     throw error;
//   }
// }
