import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@gympro.com',
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error('[Email] Failed to send:', error);
    return { success: false, error: error.message };
  }
}

export const emailTemplates = {
  membershipPurchase: (memberName, planName, expiryDate) => `
    <h1>Membership Confirmed</h1>
    <p>Hi ${memberName},</p>
    <p>Your ${planName} membership is now active until ${expiryDate}.</p>
    <p>Thank you for choosing GymPro!</p>
  `,
  paymentSuccess: (memberName, amount) => `
    <h1>Payment Successful</h1>
    <p>Hi ${memberName},</p>
    <p>We've received your payment of ₹${amount}.</p>
    <p>Thank you for your payment!</p>
  `,
  membershipExpiring: (memberName, expiryDate) => `
    <h1>Membership Expiring Soon</h1>
    <p>Hi ${memberName},</p>
    <p>Your membership expires on ${expiryDate}.</p>
    <p>Renew now to continue enjoying GymPro!</p>
  `,
  classBooking: (memberName, className, date) => `
    <h1>Class Booking Confirmed</h1>
    <p>Hi ${memberName},</p>
    <p>You've been booked for ${className} on ${date}.</p>
    <p>See you there!</p>
  `,
};
