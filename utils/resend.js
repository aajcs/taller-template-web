const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Envía un correo usando Resend con reintentos automáticos para errores 429.
 * @param {string|string[]} to - Destinatario(s)
 * @param {string} subject - Asunto del correo
 * @param {string} html - Contenido HTML del correo
 * @param {number} maxRetries - Intentos máximos (default: 3)
 * @returns {Promise<object>} Respuesta de Resend
 */
async function sendEmail(to, subject, html, maxRetries = 3) {
  const fromEnv = process.env.EMAIL_FROM;
  const simpleEmailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  const namedEmailRegex = /^.+ <[^@\s]+@[^@\s]+\.[^@\s]+>$/;

  if (!simpleEmailRegex.test(fromEnv) && !namedEmailRegex.test(fromEnv)) {
    throw new Error(
      "Invalid 'EMAIL_FROM' format. Use 'email@example.com' or 'Name <email@example.com>'"
    );
  }

  let retries = 0;
  let lastError;

  while (retries < maxRetries) {
    try {
      const response = await resend.emails.send({
        from: fromEnv,
        to,
        subject,
        html,
      });
      console.log("Resend response:", response);
      return { id: response.id || response.messageId, raw: response };
    } catch (error) {
      lastError = error;

      // Manejar específicamente el error 429
      if (error.statusCode === 429) {
        retries++;
        const waitTime = Math.pow(2, retries) * 1000; // Backoff exponencial: 2s, 4s, 8s...
        console.warn(
          `Rate limit exceeded. Retry ${retries}/${maxRetries} in ${waitTime}ms`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      } else {
        throw error; // Re-lanza otros errores (ej: 400, 500)
      }
    }
  }

  throw new Error(
    `Failed after ${maxRetries} retries. Last error: ${lastError?.message}`
  );
}

module.exports = { sendEmail };
