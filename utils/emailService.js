import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import { promisify } from 'util';
import axios from 'axios';
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

// send mail with pdf attachment
const unlinkAsync = promisify(fs.unlink);

const sendEmailWithPdf = async (email, username, password, pdfPassword, loginLink) => {
    const filePath = `./${username}.pdf`; // ✅ Fixed path syntax

    try {
        await createCredentialPdf(filePath, username, email, password, pdfPassword, loginLink);

        const pdfBuffer = await fs.promises.readFile(filePath);

        const htmlContent = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #007bff; font-size: 22px;">Your Account Details</h2>
                <p>Hello <strong>${username}</strong>,</p>
                <p>Your account has been created. Please find the attached PDF with your credentials.</p>
                <p><strong>PDF Password:</strong> Your PAN Card Number</p>
                <div style="text-align: center; margin-top: 20px;">
                    <a href="${loginLink}" 
                       style="padding:10px 20px; background:#28a745; color:#fff; text-decoration:none; border-radius: 5px; font-size: 16px;">
                       Login Now
                    </a>
                </div>
                <p>Regards,<br><strong>Flowchanger Support Team</strong></p>
            </div>
        `;

        const mailOptions = {
            from: `"Flowchanger Support" <${process.env.EMAIL_USER}>`, // ✅ Fixed sender format
            to: email,
            subject: "Your Flowchanger Account Details (PDF Attached)",
            html: htmlContent,
            attachments: [
                {
                    filename: `${username}.pdf`,
                    content: pdfBuffer,
                    contentType: "application/pdf"
                }
            ]
        };

        // Send the email
        await transporter.sendMail(mailOptions);

        console.log("✅ Email with PDF sent successfully");

        // Cleanup: Delete the temporary PDF
        await unlinkAsync(filePath);

    } catch (error) {
        console.error("❌ Failed to send email with PDF:", error);

        // Cleanup: Delete the file if sending fails
        try {
            await unlinkAsync(filePath);
        } catch (cleanupError) {
            console.warn(`⚠️ Failed to delete temp file: ${cleanupError.message}`);
        }

        throw error;
    }
};

// send email login creadential
const sendLoginCredentialsEmail = async (email, password, loginLink) => {
    const message = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2>Your Account Details</h2>
            <p>Hello,</p>
            <p>Your account has been created successfully. Below are your login credentials:</p>
            <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Email:</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${email}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Password:</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${password}</td>
                </tr>
            </table>
            <p>You can log in using the button below:</p>
            <a href="${loginLink}" style="display:inline-block; padding:10px 20px; background-color: #532D94; color:#fff; text-decoration:none; border-radius:5px; font-weight:bold;">Login Now</a>
            <p>Please change your password after logging in for security reasons.</p>
            <p>Regards,<br/>Flowchanger Support Team</p>
        </div>
    `;

    await sendEmail(email, 'Your Flowchanger Account Details', message);
};


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
    sendInviteToAdminMail,
    sendLoginCredentialsEmail,
    sendEmailWithPdf
};
