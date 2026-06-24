const nodemailer = require('nodemailer');

// Set up transporter configuration
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
const contactEmail = process.env.CONTACT_EMAIL || 'write.iqraacademy@gmail.com';

let transporter = null;

if (smtpUser && smtpPass) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });
} else {
  console.warn('WARNING: SMTP credentials not fully configured in .env. Emails will be logged to terminal console instead of being sent.');
}

/**
 * Sends contact inquiry email to the academy administrator
 */
const sendInquiryEmail = async (inquiry) => {
  const mailOptions = {
    from: `"Iqra Academy Contact Form" <${smtpUser || 'no-reply@iqraacademy.com'}>`,
    to: contactEmail,
    subject: `New Contact Form Inquiry from ${inquiry.name}`,
    text: `You have received a new contact inquiry:
    
Name: ${inquiry.name}
Phone: ${inquiry.phone}
Email: ${inquiry.email || 'Not Provided'}
Message:
${inquiry.message}

Submitted at: ${new Date(inquiry.createdAt).toLocaleString()}
`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px; max-width: 600px;">
        <h2 style="color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">New Inquiry Received</h2>
        <p><strong>Name:</strong> ${inquiry.name}</p>
        <p><strong>Phone:</strong> ${inquiry.phone}</p>
        <p><strong>Email:</strong> ${inquiry.email || '<em>Not Provided</em>'}</p>
        <div style="background-color: #f9fafb; padding: 15px; border-left: 4px solid #4f46e5; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold; margin-bottom: 8px;">Message:</p>
          <p style="margin: 0; white-space: pre-wrap;">${inquiry.message}</p>
        </div>
        <p style="font-size: 12px; color: #6b7280; margin-top: 20px; border-top: 1px solid #eaeaea; padding-top: 10px;">
          This email was generated automatically by Iqra Academy Portal.
        </p>
      </div>
    `
  };

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Email successfully sent to admin at ${contactEmail}`);
    } catch (error) {
      console.error('Error sending admin inquiry email:', error);
    }
  } else {
    console.log('--- [MOCK EMAIL SENT TO ADMIN] ---');
    console.log(`To: ${mailOptions.to}`);
    console.log(`Subject: ${mailOptions.subject}`);
    console.log(`Content:\n${mailOptions.text}`);
    console.log('----------------------------------');
  }
};

/**
 * Sends a confirmation email back to the customer/parent
 */
const sendConfirmationEmail = async (inquiry) => {
  if (!inquiry.email) return;

  const mailOptions = {
    from: `"Iqra Academy" <${smtpUser || 'no-reply@iqraacademy.com'}>`,
    to: inquiry.email,
    subject: 'We received your message - Iqra Academy',
    text: `Dear ${inquiry.name},
    
Thank you for contacting Iqra Academy! We have received your inquiry and our team will get back to you shortly.

Here is a copy of your message details:
Phone: ${inquiry.phone}
Message: ${inquiry.message}

Best Regards,
Iqra Academy Team
Dharavi, Mumbai
`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px; max-width: 600px;">
        <h2 style="color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">Thank You for Contacting Us!</h2>
        <p>Dear <strong>${inquiry.name}</strong>,</p>
        <p>We have successfully received your message and will get back to you shortly. Here are the details of the message we received:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; font-weight: bold; width: 30%;">Phone Number</td>
            <td style="padding: 8px; border-bottom: 1px solid #f3f4f6;">${inquiry.phone}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; font-weight: bold; vertical-align: top;">Message</td>
            <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; white-space: pre-wrap;">${inquiry.message}</td>
          </tr>
        </table>
        
        <p>Best Regards,</p>
        <p><strong>Iqra Academy Team</strong><br>Dharavi, Mumbai</p>
        
        <p style="font-size: 11px; color: #9ca3af; margin-top: 30px; border-top: 1px solid #f3f4f6; padding-top: 10px;">
          This is an automated receipt. Please do not reply directly to this email.
        </p>
      </div>
    `
  };

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Confirmation email successfully sent to client at ${inquiry.email}`);
    } catch (error) {
      console.error('Error sending confirmation email to client:', error);
    }
  } else {
    console.log('--- [MOCK EMAIL SENT TO CLIENT] ---');
    console.log(`To: ${mailOptions.to}`);
    console.log(`Subject: ${mailOptions.subject}`);
    console.log(`Content:\n${mailOptions.text}`);
    console.log('-----------------------------------');
  }
};

module.exports = {
  sendInquiryEmail,
  sendConfirmationEmail
};
