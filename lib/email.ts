import nodemailer from 'nodemailer'

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', 
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })
}

const createResetPasswordEmailTemplate = (resetUrl: string, userEmail: string) => {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Resetear Contraseña - DallaTrack</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .email-container {
          background-color: white;
          border-radius: 10px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 10px;
        }
        .title {
          color: #1f2937;
          font-size: 24px;
          margin-bottom: 20px;
        }
        .content {
          margin-bottom: 30px;
        }
        .reset-button {
          display: inline-block;
          background-color: #2563eb;
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          margin: 20px 0;
          text-align: center;
        }
        .reset-button:hover {
          background-color: #1d4ed8;
        }
        .warning {
          background-color: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 6px;
          padding: 15px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          font-size: 14px;
          color: #6b7280;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="logo">🏋️ DallaTrack</div>
          <h1 class="title">Resetear tu Contraseña</h1>
        </div>
        
        <div class="content">
          <p>Hola,</p>
          <p>Recibimos una solicitud para resetear la contraseña de tu cuenta de DallaTrack asociada con el email <strong>${userEmail}</strong>.</p>
          
          <p>Si realizaste esta solicitud, haz clic en el botón de abajo para crear una nueva contraseña:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="reset-button">Resetear mi Contraseña</a>
          </div>
          
          <div class="warning">
            ⚠️ <strong>Importante:</strong> Este enlace expirará en 1 hora por motivos de seguridad.
          </div>
          
          <p>Si no puedes hacer clic en el botón, copia y pega el siguiente enlace en tu navegador:</p>
          <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace;">
            ${resetUrl}
          </p>
          
          <p><strong>¿No solicitaste este cambio?</strong></p>
          <p>Si no fuiste tú quien solicitó el reset de contraseña, puedes ignorar este email de forma segura. Tu contraseña no será cambiada.</p>
        </div>
        
        <div class="footer">
          <p>Este email fue enviado por DallaTrack - Tu compañero de entrenamiento</p>
          <p>Si tienes problemas con el enlace, contacta nuestro soporte.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export async function sendResetPasswordEmail(
  userEmail: string, 
  resetToken: string
): Promise<boolean> {
  try {
    const transporter = createTransporter()
    
    const baseUrl = process.env.AUTH_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`
    
    const mailOptions = {
      from: {
        name: 'DallaTrack',
        address: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@dallatrack.com'
      },
      to: userEmail,
      subject: '🔐 Resetear tu contraseña de DallaTrack',
      html: createResetPasswordEmailTemplate(resetUrl, userEmail),
      text: `
        Hola,
        
        Recibimos una solicitud para resetear la contraseña de tu cuenta de DallaTrack.
        
        Haz clic en el siguiente enlace para crear una nueva contraseña:
        ${resetUrl}
        
        Este enlace expirará en 1 hora por motivos de seguridad.
        
        Si no solicitaste este cambio, puedes ignorar este email de forma segura.
        
        Saludos,
        El equipo de DallaTrack
      `
    }
    
    console.log(`📧 Enviando email de reset a: ${userEmail}`)
    const result = await transporter.sendMail(mailOptions)
    console.log(`✅ Email enviado exitosamente. ID: ${result.messageId}`)
    
    return true
  } catch (error) {
    console.error('❌ Error enviando email:', error)
    return false
  }
}

export async function verifyEmailConfig(): Promise<boolean> {
  try {
    const transporter = createTransporter()
    await transporter.verify()
    console.log('✅ Configuración SMTP verificada correctamente')
    return true
  } catch (error) {
    console.error('❌ Error en configuración SMTP:', error)
    return false
  }
}

export async function sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
  try {
    const transporter = createTransporter()
    
    const mailOptions = {
      from: {
        name: 'DallaTrack',
        address: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@dallatrack.com'
      },
      to: userEmail,
      subject: '🎉 ¡Bienvenido a DallaTrack!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb; text-align: center;">🏋️ ¡Bienvenido a DallaTrack!</h1>
          <p>Hola <strong>${userName}</strong>,</p>
          <p>¡Gracias por unirte a DallaTrack! Estamos emocionados de acompañarte en tu viaje fitness.</p>
          <p>Con DallaTrack podrás:</p>
          <ul>
            <li>📊 Crear y gestionar rutinas personalizadas</li>
            <li>📈 Hacer seguimiento de tu progreso</li>
            <li>💪 Registrar tus entrenamientos</li>
            <li>🎯 Alcanzar tus metas fitness</li>
          </ul>
          <p>¡Comienza tu primer entrenamiento cuando estés listo!</p>
          <p>Saludos,<br>El equipo de DallaTrack</p>
        </div>
      `,
      text: `¡Hola ${userName}! Bienvenido a DallaTrack. Estamos emocionados de acompañarte en tu viaje fitness.`
    }
    
    console.log(`📧 Enviando email de bienvenida a: ${userEmail}`)
    await transporter.sendMail(mailOptions)
    console.log(`✅ Email de bienvenida enviado`)
    
    return true
  } catch (error) {
    console.error('❌ Error enviando email de bienvenida:', error)
    return false
  }
} 