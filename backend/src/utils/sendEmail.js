const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html }) => {
  try {
    console.log("📩 Gửi email tới:", to);

    const transporter = nodemailer.createTransport({
      host: process.env.BREVO_SMTP_HOST,
      port: process.env.BREVO_SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"SmartBuilding" <nguyenchungchien362004@gmail.com>`, // ⭐ EMAIL GMAIL đã verify
      to,
      subject,
      html,
    });

    console.log("✅ Email sent:", info.messageId);
    return info;

  } catch (error) {
    console.error("❌ Lỗi khi gửi email:", error);
    throw error;
  }
};

module.exports = sendEmail;
