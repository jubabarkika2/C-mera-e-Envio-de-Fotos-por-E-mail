import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parser with a reasonable limit to support base64 images
  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ limit: "20mb", extended: true }));

  // API Route to send emails
  app.post("/api/send-email", async (req, res) => {
    try {
      const { to, image, imageName, smtpSettings } = req.body;

      if (!to || !image) {
        return res.status(400).json({ error: "E-mail de destino e imagem são obrigatórios." });
      }

      // Determine SMTP configuration from client settings or environment variables
      const host = smtpSettings?.host || process.env.SMTP_HOST;
      const port = Number(smtpSettings?.port || process.env.SMTP_PORT || 587);
      const secure = smtpSettings?.secure !== undefined ? smtpSettings.secure : (process.env.SMTP_SECURE === "true");
      const user = smtpSettings?.user || process.env.SMTP_USER;
      const pass = smtpSettings?.pass || process.env.SMTP_PASS;

      if (!host || !user || !pass) {
        return res.status(400).json({
          error: "SMTP_NOT_CONFIGURED",
          message: "Configuração do SMTP não encontrada. Por favor, configure as credenciais SMTP no menu de configurações do aplicativo."
        });
      }

      // Check if image data URL has metadata and split it
      const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let content = image;
      let contentType = "image/png";

      if (matches && matches.length === 3) {
        contentType = matches[1];
        content = matches[2];
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

      const info = await transporter.sendMail({
        from: `"Câmera FotoEnvio" <${user}>`,
        to,
        subject: `📸 Foto capturada pelo aplicativo - ${imageName || 'captura.png'}`,
        text: `Olá!\n\nSegue em anexo a foto tirada pelo aplicativo Câmera & Envio no dia ${new Date().toLocaleString("pt-BR")}.\n\nEnviado de forma segura pelo FotoEnvio App.`,
        attachments: [
          {
            filename: imageName || "captura.png",
            content: content,
            encoding: "base64",
            contentType: contentType
          }
        ]
      });

      return res.json({ success: true, messageId: info.messageId });
    } catch (error: any) {
      console.error("Error sending email:", error);
      return res.status(500).json({
        error: "SEND_ERROR",
        message: error.message || "Erro desconhecido ao enviar o e-mail."
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
