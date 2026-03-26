const nodemailer = require('nodemailer');

let cachedTransporter;

const getMailerConfig = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, MAIL_FROM } = process.env;

  return {
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    user: SMTP_USER,
    pass: SMTP_PASS,
    secure: SMTP_SECURE === 'true',
    from: MAIL_FROM || SMTP_USER || 'no-reply@dhakabus.local',
  };
};

const getTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  const config = getMailerConfig();
  if (!config.host || !config.user || !config.pass) {
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  return cachedTransporter;
};

const sendVerificationEmail = async ({ email, name, verificationUrl }) => {
  const transporter = getTransporter();
  const { from } = getMailerConfig();

  if (!transporter) {
    console.warn(`Verification email not sent to ${email}. SMTP is not configured. Verification URL: ${verificationUrl}`);
    return {
      delivered: false,
      fallbackUrl: verificationUrl,
    };
  }

  await transporter.sendMail({
    from,
    to: email,
    subject: 'Verify your Dhaka Bus account',
    text: `Hello ${name},\n\nVerify your Dhaka Bus account by opening this link:\n${verificationUrl}\n\nThis link expires in 30 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
        <h2>Verify your Dhaka Bus account</h2>
        <p>Hello ${name},</p>
        <p>Use the button below to verify your email address and activate ticket booking.</p>
        <p>
          <a href="${verificationUrl}" style="display:inline-block;padding:12px 18px;background:#06b6d4;color:#082f49;text-decoration:none;border-radius:8px;font-weight:700;">
            Verify Email
          </a>
        </p>
        <p>If the button does not work, open this link:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>This link expires in 30 minutes.</p>
      </div>
    `,
  });

  return { delivered: true };
};

const sendPasswordResetEmail = async ({ email, name, resetUrl }) => {
  const transporter = getTransporter();
  const { from } = getMailerConfig();

  if (!transporter) {
    console.warn(`Password reset email not sent to ${email}. SMTP is not configured. Reset URL: ${resetUrl}`);
    return {
      delivered: false,
      fallbackUrl: resetUrl,
    };
  }

  await transporter.sendMail({
    from,
    to: email,
    subject: 'Reset your Dhaka Bus password',
    text: `Hello ${name},\n\nReset your Dhaka Bus password by opening this link:\n${resetUrl}\n\nThis link expires in 30 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
        <h2>Reset your Dhaka Bus password</h2>
        <p>Hello ${name},</p>
        <p>Use the button below to reset your password.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#06b6d4;color:#082f49;text-decoration:none;border-radius:8px;font-weight:700;">
            Reset Password
          </a>
        </p>
        <p>If the button does not work, open this link:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link expires in 30 minutes.</p>
      </div>
    `,
  });

  return { delivered: true };
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
