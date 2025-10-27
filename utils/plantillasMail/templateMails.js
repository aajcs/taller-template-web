/**
 * Colección de plantillas de correo electrónico.
 * Cada plantilla es una función que recibe un objeto de datos y devuelve una cadena HTML.
 */
// Función para formatear la fecha en formato DD/MM/YYYY HH:mm
function formatFecha(fecha) {
  if (!fecha) return "";
  const date = new Date(fecha);
  const pad = (n) => n.toString().padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

module.exports = {
  /**
   * Plantilla para notificar la creación de un nuevo contrato.
   * @param {Object} data - Datos para la plantilla.
   * @param {string} data.nombreUsuario - Nombre del destinatario.
   * @param {string} data.numeroContrato - Número del contrato.
   * @param {string} data.nombreRefineria - Nombre de la refinería.
   * @param {string} data.nombreContacto - Nombre del contacto asociado.
   * @param {string} data.creadoPor - Nombre del usuario que creó el contrato.
   * @param {string} data.enlaceDetalle - URL para ver los detalles.
   */
  contractNotification: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
          .header { background-color: #003366; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .header img { max-width: 150px; }
          .content { padding: 30px; background-color: #ffffff; }
          .button { display: inline-block; background-color: #007bff; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; color: #6c757d; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${process.env.BACKEND_URL}/images/logoMaroil.png" alt="Logo Maroil">
            <h2>Nuevo Contrato Creado</h2>
          </div>
          <div class="content">
            <p>Hola <strong>${data.nombreUsuario}</strong>,</p>
            <p>Se ha creado un nuevo contrato en el sistema:</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Número de contrato:</strong> ${data.numeroContrato}</p>
              <p><strong>Refinería:</strong> ${data.nombreRefineria}</p>
              <p><strong>Contacto:</strong> ${data.nombreContacto}</p>
              <p><strong>Creado por:</strong> ${data.creadoPor}</p>
            </div>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${data.enlaceDetalle}" class="button">Ver detalles del contrato</a>
            </p>
            <p>Si tienes alguna pregunta, por favor contacta al administrador.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Maroil Refinery. Todos los derechos reservados.</p>
            <p>Este es un mensaje automático, por favor no respondas a esta dirección.</p>
          </div>
        </div>
      </body>
      </html>
    `,

  contractElminado: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
          .header { background-color: #003366; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .header img { max-width: 150px; }
          .content { padding: 30px; background-color: #ffffff; }
          .button { display: inline-block; background-color: #007bff; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; color: #6c757d; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${process.env.BACKEND_URL}/images/logoMaroil.png" alt="Logo Maroil">
            <h2>Se ha eliminado un contrato</h2>
          </div>
          <div class="content">
            <p>Hola <strong>${data.nombreUsuario}</strong>,</p>
            <p>Ha sido eliminado del sistema un contrato:</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Número de contrato:</strong> ${data.numeroContrato}</p>
              <p><strong>Refinería:</strong> ${data.nombreRefineria}</p>
              <p><strong>Contacto:</strong> ${data.nombreContacto}</p>
              <p><strong>Eliminado por:</strong> ${data.creadoPor}</p>
            </div>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${data.enlaceDetalle}" class="button">Ver detalles del contrato</a>
            </p>
            <p>Si tienes alguna pregunta, por favor contacta al administrador.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Maroil Refinery. Todos los derechos reservados.</p>
            <p>Este es un mensaje automático, por favor no respondas a esta dirección.</p>
          </div>
        </div>
      </body>
      </html>
    `,

  recepcionRefineria: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
          .header { background-color: #003366; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .header img { max-width: 150px; }
          .content { padding: 30px; background-color: #ffffff; }
          .button { display: inline-block; background-color: #007bff; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; color: #6c757d; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${process.env.BACKEND_URL}/images/logoMaroil.png" alt="Logo Maroil">
            <h2>Nueva Recepción en Refineria</h2>
          </div>
          <div class="content">
            <p>Hola <strong>${data.nombreUsuario}</strong>,</p>
            <p>Ha arribado una nueva recepción a la refineria:</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Número de guía:</strong> ${data.idGuia}</p>
              <p><strong>Refinería:</strong> ${data.nombreRefineria}</p>
              <p><strong>Numero de Contrato:</strong> ${data.numeroContrato}</p>
              <p><strong>Modificado por:</strong> ${data.creadoPor}</p>
              <p><strong>Fecha de Llegada:</strong> ${formatFecha(data.fecha)}</p>
            </div>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${data.enlaceDetalle}" class="button">Ver detalles de la recepción</a>
            </p>
            <p>Si tienes alguna pregunta, por favor contacta al administrador.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Maroil Refinery. Todos los derechos reservados.</p>
            <p>Este es un mensaje automático, por favor no respondas a esta dirección.</p>
          </div>
        </div>
      </body>
      </html>
    `,

  recepcionCancelada: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
          .header { background-color: #003366; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .header img { max-width: 150px; }
          .content { padding: 30px; background-color: #ffffff; }
          .button { display: inline-block; background-color: #007bff; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; color: #6c757d; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${process.env.BACKEND_URL}/images/logoMaroil.png" alt="Logo Maroil">
            <h2>Recepción Cancelada</h2>
          </div>
          <div class="content">
            <p>Hola <strong>${data.nombreUsuario}</strong>,</p>
            <p>Se ha cancelado una recepción en la refineria:</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Número de guía:</strong> ${data.idGuia}</p>
              <p><strong>Refinería:</strong> ${data.nombreRefineria}</p>
              <p><strong>Numero de Contrato:</strong> ${data.numeroContrato}</p>
              <p><strong>Cancelado por por:</strong> ${data.creadoPor}</p>
              <p><strong>Fecha de Cancelación:</strong> ${formatFecha(data.fecha)}</p>
            </div>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${data.enlaceDetalle}" class="button">Ver detalles de la recepción</a>
            </p>
            <p>Si tienes alguna pregunta, por favor contacta al administrador.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Maroil Refinery. Todos los derechos reservados.</p>
            <p>Este es un mensaje automático, por favor no respondas a esta dirección.</p>
          </div>
        </div>
      </body>
      </html>
    `,

  recepcionElminado: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
          .header { background-color: #003366; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .header img { max-width: 150px; }
          .content { padding: 30px; background-color: #ffffff; }
          .button { display: inline-block; background-color: #007bff; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; color: #6c757d; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${process.env.BACKEND_URL}/images/logoMaroil.png" alt="Logo Maroil">
            <h2>Se ha eliminado una Recepción</h2>
          </div>
          <div class="content">
            <p>Hola <strong>${data.nombreUsuario}</strong>,</p>
            <p>Se ha eliminado una recepción en la refineria:</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Número de guía:</strong> ${data.idGuia}</p>
              <p><strong>Refinería:</strong> ${data.nombreRefineria}</p>
              <p><strong>Numero de Contrato:</strong> ${data.numeroContrato}</p>
              <p><strong>Cancelado por por:</strong> ${data.creadoPor}</p>
              <p><strong>Fecha de Cancelación:</strong> ${formatFecha(data.fecha)}</p>
            </div>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${data.enlaceDetalle}" class="button">Ver detalles de la recepción</a>
            </p>
            <p>Si tienes alguna pregunta, por favor contacta al administrador.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Maroil Refinery. Todos los derechos reservados.</p>
            <p>Este es un mensaje automático, por favor no respondas a esta dirección.</p>
          </div>
        </div>
      </body>
      </html>
    `,

  corteModificado: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
          .header { background-color: #003366; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .header img { max-width: 150px; }
          .content { padding: 30px; background-color: #ffffff; }
          .button { display: inline-block; background-color: #007bff; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; color: #6c757d; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${process.env.BACKEND_URL}/images/logoMaroil.png" alt="Logo Maroil">
            <h2>Modificación de Corte</h2>
          </div>
          <div class="content">
            <p>Hola <strong>${data.nombreUsuario}</strong>,</p>
            <p>Ha sido modificado un corte de refinación:</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Número de corte:</strong> ${data.numeroCorteRefinacion}</p>
              <p><strong>Refinería:</strong> ${data.nombreRefineria}</p>
              <p><strong>Oservación:</strong> ${data.observacion}</p>
              <p><strong>Fecha de modificación:</strong> ${formatFecha(data.fecha)}</p>
              <p><strong>Modificado por:</strong> ${data.creadoPor}</p>
            </div>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${data.enlaceDetalle}" class="button">Ver detalles de la recepción</a>
            </p>
            <p>Si tienes alguna pregunta, por favor contacta al administrador.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Maroil Refinery. Todos los derechos reservados.</p>
            <p>Este es un mensaje automático, por favor no respondas a esta dirección.</p>
          </div>
        </div>
      </body>
      </html>
    `,

  chequeoRechazado: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
          .header { background-color: #003366; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .header img { max-width: 150px; }
          .content { padding: 30px; background-color: #ffffff; }
          .button { display: inline-block; background-color: #007bff; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; color: #6c757d; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${process.env.BACKEND_URL}/images/logoMaroil.png" alt="Logo Maroil">
            <h2>Se ha rechazado un chequeo de calidad </h2>
          </div>
          <div class="content">
            <p>Hola <strong>${data.nombreUsuario}</strong>,</p>
            <p>Ha sido rechazado un chequeo de calidad aplicado a: ${data.operacion} </p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Número de chequeo</strong> ${data.numeroChequeoCalidad}</p>
              <p><strong>Refinería:</strong> ${data.nombreRefineria}</p>
              <p><strong>Referencia:</strong> ${data.idReferencia}</p>
              <p><strong>Estado:</strong> ${data.estado}</p>
              <p><strong>Fecha de chequeo:</strong> ${formatFecha(data.fecha)}</p>
              <p><strong>Modificado por:</strong> ${data.creadoPor}</p>
            </div>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${data.enlaceDetalle}" class="button">Ver detalles del chequeo</a>
            </p>
            <p>Si tienes alguna pregunta, por favor contacta al administrador.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Maroil Refinery. Todos los derechos reservados.</p>
            <p>Este es un mensaje automático, por favor no respondas a esta dirección.</p>
          </div>
        </div>
      </body>
      </html>
    `,
};
