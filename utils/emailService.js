import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // Adjust based on your email provider
    port: 587,
    secure: false, // false for TLS - change to true if using port 465
    auth: {
        user: process.env.EMAIL_USER,      // Your email (support@yourdomain.com)
        pass: process.env.EMAIL_PASS    // App password or SMTP password
    }
});

// Reusable email sender
const sendEmail = async (to, subject, htmlContent) => {
    const mailOptions = {
        from: `"Flowchanger Support" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html: htmlContent,
    };
    await transporter.sendMail(mailOptions);
};

const generateOtp = () => Math.floor(100000 + Math.random() * 900000);
// OTP email template
const sendOtpEmail = async (email) => {
    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.user.update({
        where: { email },
        data: { otp, otpExpiresAt }
    });

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2>Your OTP Code</h2>
            <p>Hello,</p>
            <p>Your OTP code is: <strong>${otp}</strong></p>
            <p>This code is valid for 5 minutes. Please do not share it with anyone.</p>
            <p>Regards,<br/>Flowchanger Support Team</p>
        </div>
    `;
    await sendEmail(email, 'Your OTP Code', htmlContent);
};



// Verification link email template
const sendVerificationLinkEmail = async (email, link) => {
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2>Verify Your Account</h2>
            <p>Hello,</p>
            <p>Click the link below to verify your account:</p>
            <a href="${link}" style="display:inline-block; padding:10px 20px; background-color:#007bff; color:#fff; text-decoration:none; border-radius:5px;">Verify Account</a>
            <p>If you did not sign up, you can safely ignore this email.</p>
            <p>Regards,<br/>Flowchanger Support Team</p>
        </div>
    `;
    await sendEmail(email, 'Verify Your Account', htmlContent);
};

// General message email template
const sendGeneralMessage = async (email, subject, message) => {
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <p>${message}</p>
            <p>Regards,<br/>Flowchanger Support Team</p>
        </div>
    `;
    await sendEmail(email, subject, htmlContent);
};

export {
    sendOtpEmail,
    sendVerificationLinkEmail,
    sendGeneralMessage,
};
