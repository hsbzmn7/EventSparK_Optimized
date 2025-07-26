const nodemailer = require("nodemailer");
const QRCode = require("qrcode");
const PDFDocument = require("pdfkit");

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email (type: 'verify' or 'reset' or 'invite')
const sendOTPEmail = async (email, otp, type = "verify", role = "") => {
  try {
    const transporter = createTransporter();
    let subject, text, html;
    if (type === "verify") {
      subject = "Verify your email for EventSpark";
      text = `Your verification code is: ${otp}`;
      html = `<p>Your verification code is: <b>${otp}</b></p>`;
    } else if (type === "reset") {
      subject = "Reset your EventSpark password";
      text = `Your password reset code is: ${otp}`;
      html = `<p>Your password reset code is: <b>${otp}</b></p>`;
    } else if (type === "invite") {
      subject = `Congratulations! You've been added as an ${role} on EventSpark`;
      text = `Congratulations! You have been added as an ${role} on EventSpark.\n\nYour temporary password is: ${otp}\n\nPlease use this password in the 'Reset Password' flow to set your own password and activate your account.`;
      html = `<p>Congratulations! You have been added as an <b>${role}</b> on <b>EventSpark</b>.</p><p>Your temporary password is: <b>${otp}</b></p><p>Please use this password in the <b>Reset Password</b> flow to set your own password and activate your account.</p>`;
    } else if (type === "rolechange") {
      subject = `Your EventSpark role has been updated to ${role}`;
      text = `Your role on EventSpark has been changed. You are now an ${role}.`;
      html = `<p>Your role on <b>EventSpark</b> has been changed. You are now an <b>${role}</b>.</p>`;
    } else {
      subject = "EventSpark Notification";
      text = `Your code is: ${otp}`;
      html = `<p>Your code is: <b>${otp}</b></p>`;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: subject,
      text: text,
      html: html,
    };
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email: ", error);
    return false;
  }
};

// Send welcome email
const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Welcome to EventSpark!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">Welcome to EventSpark!</h2>
          <p>Hello ${name},</p>
          <p>Thank you for signing up with EventSpark! We're excited to have you on board.</p>
          <p>You can now start exploring and creating amazing events.</p>
          <p>Best regards,<br>The EventSpark Team</p>
        </div>
      `,
    };
    const info = await transporter.sendMail(mailOptions);
    console.log("Welcome email sent: ", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending welcome email: ", error);
    return false;
  }
};

// Send booking confirmation email
const sendBookingConfirmationEmail = async (
  email,
  userName,
  eventName,
  seatNumber,
  ticketPrice,
  qrCode,
  eventDate,
  eventTime,
  eventVenue
) => {
  try {
    const transporter = createTransporter();

    // Generate PDF in memory
    const doc = new PDFDocument();
    let buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", async () => {
      const pdfBuffer = Buffer.concat(buffers);

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Booking Confirmed - ${eventName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #2563eb; text-align: center; margin-bottom: 30px;">🎉 Booking Confirmed!</h2>
              <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: #1e40af; margin-top: 0;">Event Details</h3>
                <p><strong>Event:</strong> ${eventName}</p>
                <p><strong>Date:</strong> ${eventDate}</p>
                <p><strong>Time:</strong> ${eventTime}</p>
                <p><strong>Venue:</strong> ${eventVenue}</p>
                <p><strong>Seat:</strong> ${seatNumber}</p>
                <p><strong>Price:</strong> $${ticketPrice}</p>
              </div>
              <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 20px;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                  <strong>Important:</strong> Please arrive 15 minutes before the event starts. 
                  Have your ticket PDF ready for scanning at the entrance.
                </p>
              </div>
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px;">
                  Thank you for choosing EventSpark!<br>
                  Enjoy your event!
                </p>
              </div>
            </div>
          </div>
        `,
        attachments: [
          {
            filename: "EventTicket.pdf",
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("Booking confirmation email sent: ", info.messageId);
      return true;
    });

    // Build your PDF content here
    doc.fontSize(20).text("Event Ticket", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Name: ${userName}`);
    doc.text(`Event: ${eventName}`);
    doc.text(`Date: ${eventDate}`);
    doc.text(`Time: ${eventTime}`);
    doc.text(`Venue: ${eventVenue}`);
    doc.text(`Seat: ${seatNumber}`);
    doc.text(`Price: $${ticketPrice}`);
    doc.end();
  } catch (error) {
    console.error("Error sending booking confirmation email: ", error);
    return false;
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendWelcomeEmail,
  sendBookingConfirmationEmail,
};
