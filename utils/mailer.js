const { Resend } = require('resend');

// Set up Resend client configuration
const resendApiKey = process.env.RESEND_API_KEY;
const contactEmail = process.env.CONTACT_EMAIL || 'write.iqraacademy@gmail.com';

let resend = null;

if (resendApiKey) {
  resend = new Resend(resendApiKey);
} else {
  console.warn('WARNING: RESEND_API_KEY not configured in .env. Emails will be logged to terminal console instead of being sent.');
}

/**
 * Sends contact inquiry email to the academy administrator
 */
const sendInquiryEmail = async (inquiry) => {
  const mailOptions = {
    // If domain is not verified, Resend requires using onboarding@resend.dev on free tier
    from: 'Iqra Academy Contact Form <onboarding@resend.dev>',
    to: contactEmail,
    subject: `New Contact Form Inquiry from ${inquiry.name}`,
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

  if (resend) {
    try {
      const data = await resend.emails.send(mailOptions);
      console.log(`Email successfully sent via Resend to admin at ${contactEmail}`, data);
    } catch (error) {
      console.error('Error sending admin inquiry email via Resend:', error.message);
    }
  } else {
    console.log('--- [MOCK EMAIL SENT TO ADMIN (RESEND UNCONFIGURED)] ---');
    console.log(`To: ${mailOptions.to}`);
    console.log(`Subject: ${mailOptions.subject}`);
    console.log(`Content:\nName: ${inquiry.name}\nPhone: ${inquiry.phone}\nMessage: ${inquiry.message}`);
    console.log('--------------------------------------------------------');
  }
};

/**
 * Sends a confirmation email back to the customer/parent
 */
const sendConfirmationEmail = async (inquiry) => {
  if (!inquiry.email) return;

  const mailOptions = {
    from: 'Iqra Academy <onboarding@resend.dev>',
    to: inquiry.email,
    subject: 'We received your message - Iqra Academy',
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

  if (resend) {
    try {
      // Note: On Resend free tier/onboarding, you can only send to your own registered email address.
      // To send to external client emails, a custom domain must be verified on Resend.
      const data = await resend.emails.send(mailOptions);
      console.log(`Confirmation email successfully sent via Resend to client at ${inquiry.email}`, data);
    } catch (error) {
      console.warn('Error sending confirmation email to client via Resend (Note: Sandbox mode only allows sending to your verified email):', error.message);
    }
  } else {
    console.log('--- [MOCK EMAIL SENT TO CLIENT (RESEND UNCONFIGURED)] ---');
    console.log(`To: ${mailOptions.to}`);
    console.log(`Subject: ${mailOptions.subject}`);
    console.log(`Content:\nName: ${inquiry.name}\nPhone: ${inquiry.phone}\nMessage: ${inquiry.message}`);
    console.log('---------------------------------------------------------');
  }
};

module.exports = {
  sendInquiryEmail,
  sendConfirmationEmail
};
