const nodemailer = require('nodemailer');
require('dotenv').config();

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
const contactEmail = process.env.CONTACT_EMAIL || smtpUser;

console.log('--- Mailer Configuration Test ---');
console.log(`SMTP Host: ${smtpHost}`);
console.log(`SMTP Port: ${smtpPort}`);
console.log(`SMTP User: ${smtpUser}`);
console.log(`SMTP Pass: ${smtpPass ? '****** (configured)' : '(empty)'}`);
console.log(`Contact Email (Recipient): ${contactEmail}`);
console.log('---------------------------------');

if (!smtpUser || !smtpPass) {
  console.error('Error: SMTP_USER and SMTP_PASS must be configured in your backend/.env file.');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465, // true for 465, false for other ports
  auth: {
    user: smtpUser,
    pass: smtpPass
  }
});

const run = async () => {
  try {
    console.log('Verifying SMTP connection connection...');
    await transporter.verify();
    console.log('✔ Transporter is ready to take messages!');

    const mailOptions = {
      from: `"Iqra Academy Test" <${smtpUser}>`,
      to: contactEmail,
      subject: 'Nodemailer Connection Test',
      text: 'Congratulations! Nodemailer is successfully connected and emails can now be sent.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px; max-width: 600px;">
          <h2 style="color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">Connection Success!</h2>
          <p>This is a test email sent from <strong>Iqra Academy Backend Portal</strong> using Nodemailer.</p>
          <p>If you received this message, your mail configuration is 100% working!</p>
          <p style="font-size: 12px; color: #6b7280; margin-top: 20px; border-top: 1px solid #eaeaea; padding-top: 10px;">
            Sent on: ${new Date().toLocaleString()}
          </p>
        </div>
      `
    };

    console.log(`Sending test email to ${contactEmail}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log('✔ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('✖ SMTP connection / mail send failed:');
    console.error(error);
  }
};

run();
