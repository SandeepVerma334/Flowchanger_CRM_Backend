import nodemailer from 'nodemailer';
//  .env file import
import dotenv from 'dotenv';
import prisma from '../prisma/prisma.js';
dotenv.config();

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
            <a href="${link}" style="display:inline-block; padding:10px 20px; background-color:#532D94; color:#fff; text-decoration:none; border-radius:5px;">Verify Account</a>
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

const sendPasswordResetAndForgotEmail = async (email, name, resetToken, type) => {
    try {
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;

        const expiryTime = process.env.RESET_LINK_EXPIRY || "15 minutes";
        const subject = type === "reset"
            ? "Reset Your Password - Flow Changer"
            : "Access Your Account - Flow Changer";

        const messageContent = type === "reset"
            ? "You requested a password reset. Click the button below to reset your password:"
            : "You requested access to your account. Click the button below to log in without resetting your password:";

        const buttonText = type === "reset" ? "Reset Password" : "Login Now";

        const note = type === "reset" ? `<p><strong>Note:</strong> This link will expire in ${expiryTime}.</p>` : "";
        const message = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #2C3E50;">Hello, ${name}</h2>            
                <p>${messageContent}</p>

                <div style="text-align: left; margin: 20px 0;">
                    <a href="${resetLink}" 
                       style="background-color: #532D94; color: #ffffff; padding: 12px 20px; text-decoration: none; font-size: 16px; border-radius: 5px; display: inline-block;">
                       ${buttonText}
                    </a>
                </div>
                ${note}
                <p>If you did not request this, please ignore this email.</p>

                <p>Best Regards,</p>
                <p><strong>Flow Changer Team</strong></p>
            </div>
        `;

        await sendEmail(email, subject, message);
    } catch (error) {
        console.error("Error sending password reset email:", error);
        throw new Error("Failed to send password reset email");
    }
};


const sendInviteToAdminMail = async (email) => {
    try {
        const signupLink = process.env.FRONTEND_URL + "/signup";
        const subject = "Welcome to Flow Changer Agency";
        const text = `Hello, ${email}\n\n you have been invited to join Flow Changer Agency. Please sign up using the provided link.\n\n${signupLink}`;

        const message = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h3 style="color: #000000;">You are Invited to Flow Changer Agency</h3>            
                <p> Hello, <span style="color: #532D94 !important;">${email}</span> <br><br>
                    You have been invited to join Flow Changer Agency. Please sign up using the provided link.
                </p>
                <div style="text-align: left; margin: 20px 0;">
                    <a href="${signupLink}" 
                       style="background-color: #532D94; color: #ffffff; padding: 12px 20px; text-decoration: none; font-size: 16px; border-radius: 5px; display: inline-block;">
                        Sign Up Now
                    </a>
                </div>

                <p>If you did not request this, please ignore this email.</p>

                <p>Best Regards,</p>
                <p><strong>Flow Changer Team</strong></p>
            </div>
        `;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject,
            text,
            html: message,
        };

        const info = await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error("Error sending email:", error);
        return { success: false, error: error.message };
    }
};



export {
    sendOtpEmail,
    sendVerificationLinkEmail,
    sendGeneralMessage,
    sendPasswordResetAndForgotEmail,
    sendInviteToAdminMail
};
