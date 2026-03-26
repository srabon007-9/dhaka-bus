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

const sendPaymentConfirmationEmail = async ({ email, name, ticket, amount, paymentId }) => {
  const transporter = getTransporter();
  const { from } = getMailerConfig();

  if (!transporter) {
    console.warn(`Payment confirmation email not sent to ${email}. SMTP is not configured.`);
    return { delivered: false };
  }

  const ticketDetails = `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;"><strong>Ticket ID:</strong></td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${ticket.id}</td>
    </tr>
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;"><strong>Route:</strong></td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${ticket.route_name}</td>
    </tr>
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;"><strong>Bus:</strong></td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${ticket.bus_name}</td>
    </tr>
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;"><strong>Departure:</strong></td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${new Date(ticket.departure_time).toLocaleString()}</td>
    </tr>
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;"><strong>Boarding:</strong></td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${ticket.boarding_stop_name}</td>
    </tr>
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;"><strong>Dropoff:</strong></td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${ticket.dropoff_stop_name}</td>
    </tr>
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;"><strong>Seats:</strong></td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${ticket.seat_numbers.join(', ')}</td>
    </tr>
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;"><strong>Passenger:</strong></td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${ticket.passenger_name}</td>
    </tr>
    <tr>
      <td style="padding: 12px;"><strong>Total Price:</strong></td>
      <td style="padding: 12px;"><strong>${ticket.total_price} BDT</strong></td>
    </tr>
  `;

  await transporter.sendMail({
    from,
    to: email,
    subject: 'Payment Confirmed - Your Dhaka Bus Ticket',
    text: `Hello ${name},\n\nYour payment of ${amount} BDT has been confirmed!\n\nTicket Details:\nRoute: ${ticket.route_name}\nBus: ${ticket.bus_name}\nSeats: ${ticket.seat_numbers.join(', ')}\nDeparture: ${new Date(ticket.departure_time).toLocaleString()}\nTotal: ${ticket.total_price} BDT\n\nThank you for booking with Dhaka Bus!`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a; max-width: 600px; margin: 0 auto;">
        <div style="background: #06b6d4; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Payment Confirmed!</h1>
        </div>
        
        <div style="background: #f1f5f9; padding: 20px; border-radius: 0 0 8px 8px;">
          <p>Hello <strong>${name}</strong>,</p>
          
          <p style="margin: 20px 0;">Your payment of <strong>${amount} BDT</strong> has been confirmed and processed successfully!</p>
          
          <h3 style="color: #1e293b; margin-top: 20px; margin-bottom: 10px;">Ticket Details</h3>
          
          <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
            ${ticketDetails}
          </table>
          
          <div style="background: #dbeafe; padding: 15px; margin-top: 20px; border-radius: 8px; border-left: 4px solid #06b6d4;">
            <p style="margin: 0; color: #0c4a6e;"><strong>Important:</strong> Please arrive at the boarding stop at least 15 minutes before departure. Bring valid ID for verification.</p>
          </div>
          
          <p style="margin-top: 20px; color: #475569;">Payment Reference: <code style="background: #e2e8f0; padding: 4px 8px; border-radius: 4px;">${paymentId}</code></p>
          
          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #cbd5e1; color: #64748b; font-size: 14px;">
            Thank you for choosing Dhaka Bus! If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    `,
  });

  return { delivered: true };
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPaymentConfirmationEmail,
};
