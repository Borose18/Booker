import nodemailer from "nodemailer";
import { format } from "date-fns";

interface AppointmentEmailData {
  customerName: string;
  customerEmail: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  businessName: string;
  businessEmail?: string | null;
  businessPhone?: string | null;
}

function createTransport() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendBookingConfirmation(data: AppointmentEmailData) {
  const transporter = createTransport();
  if (!transporter) return;

  const formattedDate = format(new Date(data.date), "EEEE, MMMM d, yyyy");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 0; }
        .container { max-width: 560px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 40px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 700; }
        .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px; }
        .body { padding: 32px 40px; }
        .greeting { font-size: 18px; color: #111827; margin-bottom: 8px; }
        .message { color: #6b7280; font-size: 15px; margin-bottom: 28px; line-height: 1.6; }
        .booking-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; margin-bottom: 28px; }
        .booking-card h3 { margin: 0 0 16px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; }
        .detail-row { display: flex; align-items: center; margin-bottom: 12px; }
        .detail-row:last-child { margin-bottom: 0; }
        .detail-label { font-size: 14px; color: #6b7280; width: 100px; flex-shrink: 0; }
        .detail-value { font-size: 15px; font-weight: 600; color: #111827; }
        .price-badge { display: inline-block; background: #ecfdf5; color: #059669; font-weight: 700; padding: 2px 10px; border-radius: 20px; font-size: 15px; }
        .footer { padding: 20px 40px; background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center; }
        .footer p { margin: 0; font-size: 13px; color: #9ca3af; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${data.businessName}</h1>
          <p>Booking Confirmation</p>
        </div>
        <div class="body">
          <p class="greeting">Hi ${data.customerName},</p>
          <p class="message">Your appointment has been confirmed! Here are your booking details:</p>
          <div class="booking-card">
            <h3>Appointment Details</h3>
            <div class="detail-row">
              <span class="detail-label">Service</span>
              <span class="detail-value">${data.serviceName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date</span>
              <span class="detail-value">${formattedDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Time</span>
              <span class="detail-value">${data.startTime} – ${data.endTime}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Price</span>
              <span class="detail-value"><span class="price-badge">$${data.price.toFixed(2)}</span></span>
            </div>
          </div>
          <p class="message" style="margin-bottom: 0;">
            If you need to cancel or reschedule, please contact us as soon as possible.
            ${data.businessEmail ? `<br>Email: <a href="mailto:${data.businessEmail}" style="color: #4f46e5;">${data.businessEmail}</a>` : ""}
            ${data.businessPhone ? `<br>Phone: ${data.businessPhone}` : ""}
          </p>
        </div>
        <div class="footer">
          <p>This confirmation was sent by ${data.businessName}.<br>Please keep this email for your records.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `"${data.businessName}" <noreply@booker.app>`,
    to: data.customerEmail,
    subject: `Booking Confirmed – ${data.serviceName} on ${formattedDate}`,
    html,
  });
}

export async function sendCancellationEmail(data: AppointmentEmailData) {
  const transporter = createTransport();
  if (!transporter) return;

  const formattedDate = format(new Date(data.date), "EEEE, MMMM d, yyyy");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 0; }
        .container { max-width: 560px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .header { background: #ef4444; padding: 32px 40px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 700; }
        .body { padding: 32px 40px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>Booking Cancelled</h1></div>
        <div class="body">
          <p>Hi ${data.customerName},</p>
          <p>Your appointment for <strong>${data.serviceName}</strong> on <strong>${formattedDate}</strong> at <strong>${data.startTime}</strong> has been cancelled.</p>
          <p>If you'd like to rebook, please visit our booking page.</p>
          ${data.businessEmail ? `<p>Questions? Contact us at <a href="mailto:${data.businessEmail}">${data.businessEmail}</a></p>` : ""}
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `"${data.businessName}" <noreply@booker.app>`,
    to: data.customerEmail,
    subject: `Booking Cancelled – ${data.serviceName} on ${formattedDate}`,
    html,
  });
}
