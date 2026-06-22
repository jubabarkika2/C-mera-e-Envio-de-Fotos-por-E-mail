import nodemailer from "nodemailer";

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method Not Allowed" }));
    return;
  }

  try {
    const { to, image, imageName, smtpSettings, images } = req.body || {};

    const hasImages = (images && Array.isArray(images) && images.length > 0);
    if (!to || (!image && !hasImages)) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "E-mail de destino e imagem(ns) são obrigatórios." }));
      return;
    }

    // Determine SMTP configuration from client settings or environment variables
    const host = smtpSettings?.host || process.env.SMTP_HOST;
    const port = Number(smtpSettings?.port || process.env.SMTP_PORT || 587);
    const secure = smtpSettings?.secure !== undefined ? smtpSettings.secure : (process.env.SMTP_SECURE === "true");
    const user = smtpSettings?.user || process.env.SMTP_USER;
    const pass = smtpSettings?.pass || process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({
        error: "SMTP_NOT_CONFIGURED",
        message: "Configuração do SMTP não encontrada. Por favor, configure as credenciais SMTP no menu de configurações do aplicativo."
      }));
      return;
    }

    // Build attachments
    const attachments = [];

    if (hasImages) {
      for (const item of images) {
        if (!item.dataUrl) continue;
        const matches = item.dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        let content = item.dataUrl;
        let contentType = "image/png";
        if (matches && matches.length === 3) {
          contentType = matches[1];
          content = matches[2];
        }
        attachments.push({
          filename: item.imageName || "captura.png",
          content: content,
          encoding: "base64",
          contentType: contentType
        });
      }
    } else if (image) {
      const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let content = image;
      let contentType = "image/png";
      if (matches && matches.length === 3) {
        contentType = matches[1];
        content = matches[2];
      }
      attachments.push({
        filename: imageName || "captura.png",
        content: content,
        encoding: "base64",
        contentType: contentType
      });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass
      }
    });

    const isMultiple = attachments.length > 1;
    const subject = isMultiple
      ? `📸 ${attachments.length} fotos enviadas pelo aplicativo`
      : `📸 Foto capturada pelo aplicativo - ${imageName || 'captura.png'}`;

    const text = isMultiple
      ? `Olá!\n\nSeguem em anexo as ${attachments.length} fotos enviadas pelo aplicativo Câmera & Envio no dia ${new Date().toLocaleString("pt-BR")}.\n\nEnviado de forma segura pelo FotoEnvio App.`
      : `Olá!\n\nSegue em anexo a foto tirada pelo aplicativo Câmera & Envio no dia ${new Date().toLocaleString("pt-BR")}.\n\nEnviado de forma segura pelo FotoEnvio App.`;

    const info = await transporter.sendMail({
      from: `"Câmera FotoEnvio" <${user}>`,
      to,
      subject,
      text,
      attachments
    });

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: true, messageId: info.messageId }));
  } catch (error: any) {
    console.error("Error sending email:", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      error: "SEND_ERROR",
      message: error.message || "Erro desconhecido ao enviar o e-mail."
    }));
  }
}
