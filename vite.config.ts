import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import nodemailer from 'nodemailer';

function expressLikeApiPlugin() {
  return {
    name: 'express-like-api-plugin',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.url?.split('?')[0];
        
        if (url === '/api/send-email' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk;
          });
          
          req.on('end', async () => {
            try {
              const { to, image, imageName, smtpSettings } = JSON.parse(body);

              if (!to || !image) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'E-mail de destino e imagem são obrigatórios.' }));
                return;
              }

              // Determine SMTP configuration from client settings or environment variables
              const host = smtpSettings?.host || process.env.SMTP_HOST;
              const port = Number(smtpSettings?.port || process.env.SMTP_PORT || 587);
              const secure = smtpSettings?.secure !== undefined ? smtpSettings.secure : (process.env.SMTP_SECURE === 'true');
              const user = smtpSettings?.user || process.env.SMTP_USER;
              const pass = smtpSettings?.pass || process.env.SMTP_PASS;

              if (!host || !user || !pass) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  error: 'SMTP_NOT_CONFIGURED',
                  message: 'Configuração do SMTP não encontrada. Por favor, configure as credenciais SMTP no menu de configurações do aplicativo.'
                }));
                return;
              }

              // Parse base64
              const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
              let content = image;
              let contentType = 'image/png';

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
                text: `Olá!\n\nSegue em anexo a foto tirada pelo aplicativo Câmera & Envio no dia ${new Date().toLocaleString('pt-BR')}.\n\nEnviado de forma segura pelo FotoEnvio App.`,
                attachments: [
                  {
                    filename: imageName || 'captura.png',
                    content: content,
                    encoding: 'base64',
                    contentType: contentType
                  }
                ]
              });

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, messageId: info.messageId }));
            } catch (error: any) {
              console.error('API Plugin error:', error);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                error: 'SEND_ERROR',
                message: error.message || 'Erro desconhecido ao enviar o e-mail.'
              }));
            }
          });
        } else if (url === '/api/health') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 'ok', source: 'vite-plugin-dev' }));
        } else {
          next();
        }
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), expressLikeApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
