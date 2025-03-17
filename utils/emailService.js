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
const createCredentialPdf = async (filePath, username, email, password, pdfPassword) => {
    return new Promise(async (resolve, reject) => {
        try {
            const logoResponse = await axios.get(
                'https://th.bing.com/th/id/OIP.o4psCQ-mkEsCHRbldlmfgAAAAA?rs=1&pid=ImgDetMain',
                { responseType: 'arraybuffer' }
            );
            const logoBuffer = Buffer.from(logoResponse.data, 'binary');

            const doc = new PDFDocument({
                size: 'A4',
                margin: 40,
                userPassword: pdfPassword,
                permissions: {
                    printing: 'highResolution',
                    modifying: false,
                    copying: false,
                    annotating: false,
                }
            });

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Header section
            doc.rect(0, 0, doc.page.width, 120).fill('#ffffff');
            doc.image(logoBuffer, 40, 15, { width: 100 });
            doc.fillColor('#5A3AA5')
                .fontSize(10)
                .font('Helvetica-Bold')
                .text('UDYAM-RJ-15-0077988', doc.page.width - 180, 20, {
                    width: 140,
                    align: 'right',
                });

            // Purple Address Bar
            doc.save();
            doc.fillColor('#5A3AA5').rect(0, 100, doc.page.width, 40).fill();
            doc.restore();

            doc.fillColor('#ffffff')
                .fontSize(9)
                .font('Helvetica')
                .text(
                    'Aggarwal colony - 8A,1st Floor, B Block, Nosegay School Road,\nHanumangarh Rd, Sri Ganganagar, Rajasthan 335001',
                    40, 110, { width: doc.page.width - 200 }
                );

            // Watermark logo
            const pageWidth = doc.page.width;
            const pageHeight = doc.page.height;
            const watermarkWidth = 300; // Adjust as needed
            const watermarkHeight = 300; // Adjust to maintain aspect ratio if needed

            const centerX = (pageWidth - watermarkWidth) / 2;
            const centerY = (pageHeight - watermarkHeight) / 2;

            doc.save();
            doc.fillOpacity(0.05);
            doc.image(logoBuffer, centerX, centerY, { width: watermarkWidth });
            doc.restore();

            // Confidential title section
            doc.save();
            doc.fillColor('#5A3AA5').rect(40, 180, 515, 30).fill();
            doc.fillColor('white').fontSize(16).font('Helvetica-Bold')
                .text('CONFIDENTIAL LOGIN CREDENTIALS', 40, 188, { align: 'center', width: 515 });
            doc.restore();

            // Main body text
            doc.y = 230;
            doc.fillColor('#333333').fontSize(11).font('Helvetica')
                .text(`Dear ${username},`, { align: 'left' });
            doc.y += 15;

            doc.text('We are pleased to share your login credentials for accessing your Flow Changer account. These credentials give you access to our client portal where you can track your project progress and communicate with our team.');
            doc.y += 30;

            // ===== Login Box Section (with spacing above and below) =====
            const loginBoxTop = 310;  // Adjust this value to move box up/down
            const loginBoxHeight = 140;  // Increased for better spacing
            const boxPadding = 15;  // Internal padding within the box

            // Draw box
            doc.save();
            doc.roundedRect(40, loginBoxTop, 395, loginBoxHeight, 10).stroke('#5A3AA5');
            doc.restore();

            // Content inside box
            let contentY = loginBoxTop + boxPadding;

            doc.fillColor('#5A3AA5').fontSize(13).font('Helvetica-Bold')
                .text('Login Details', 60, contentY - 3);

            contentY += 15;
            doc.moveTo(40, contentY).lineTo(435, contentY).stroke('#5A3AA5');
            contentY += 15;

            doc.fillColor('#333333').fontSize(11).font('Helvetica')
                .text('Email:', 60, contentY);
            doc.font('Helvetica-Bold').text(email, 160, contentY);

            contentY += 20;
            doc.font('Helvetica').text('Password:', 60, contentY);
            doc.font('Helvetica-Bold').text(password, 160, contentY);

            contentY += 25;

            // URL button
            // Draw the button border (optional, for visible button with stroke, remove fill() for transparency)
            doc.roundedRect(160, contentY, 200, 22, 5)
                .fillAndStroke('#5A3AA5', '#5A3AA5');  // Solid button with purple fill and stroke

            // Add text inside the button
            doc.fillColor('white')
                .font('Helvetica-Bold')
                .fontSize(11)
                .text('Login to App', 220, contentY + 6, { width: 100, align: 'center' });

            // Add a clickable link over the button
            doc.link(160, contentY, 200, 22, 'https://app.owchanger.com/login');
            // ===== Instructions below box =====
            doc.y = loginBoxTop + loginBoxHeight + 20;
            doc.fillColor('#333333').fontSize(10).text(
                'Please keep these credentials safe and do not share them with anyone. If you have any issues logging in, feel free to contact our support team.', 40, doc.y
            );

            // Signature section
            doc.moveDown(2);
            doc.fillColor('#333333').font('Helvetica')
                .fontSize(10)
                .text('Warm regards,', 40, doc.y);

            doc.moveDown(0.5);
            doc.font('Helvetica-Bold').fontSize(12).text('PRADEEP KUMAR', 40);
            doc.moveDown(0.5);
            doc.font('Helvetica').fontSize(10).text('Founder & CEO');
            doc.text('Flowchanger Digital Marketing Agency');


            // Footer
            doc.strokeColor('#5A3AA5').lineWidth(1).moveTo(40, 680).lineTo(555, 680).stroke();

            // Contact info
            doc.circle(70, 710, 8).fillAndStroke('#5A3AA5', '#5A3AA5');
            doc.fillColor('white').fontSize(10).text('+', 67, 705);
            doc.fillColor('#333333').text('+91 6378277791', 85, 705);

            doc.circle(215, 710, 8).fillAndStroke('#5A3AA5', '#5A3AA5');
            doc.fillColor('white').text('w', 212, 705);
            doc.fillColor('#333333').text('www.flowchanger.com', 230, 705);

            doc.circle(390, 710, 8).fillAndStroke('#5A3AA5', '#5A3AA5');
            doc.fillColor('white').text('@', 385, 705);
            doc.fillColor('#333333').text('flowchangeragency@gmail.com', 403, 705);

            // Finalize
            doc.end();
            stream.on('finish', resolve);
            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};
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
// const sendLoginCredentialsEmail = async (email, password, loginLink) => {
//     const message = `
//         <div style="font-family: Arial, sans-serif; line-height: 1.5;">
//             <h2>Your Account Details</h2>
//             <p>Hello,</p>
//             <p>Your account has been created successfully. Below are your login credentials:</p>
//             <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
//                 <tr>
//                     <td style="padding: 10px; border: 1px solid #ddd;"><strong>Email:</strong></td>
//                     <td style="padding: 10px; border: 1px solid #ddd;">${email}</td>
//                 </tr>
//                 <tr>
//                     <td style="padding: 10px; border: 1px solid #ddd;"><strong>Password:</strong></td>
//                     <td style="padding: 10px; border: 1px solid #ddd;">${password}</td>
//                 </tr>
//             </table>
//             <p>You can log in using the button below:</p>
//             <a href="${loginLink}" style="display:inline-block; padding:10px 20px; background-color: #532D94; color:#fff; text-decoration:none; border-radius:5px; font-weight:bold;">Login Now</a>
//             <p>Please change your password after logging in for security reasons.</p>
//             <p>Regards,<br/>Flowchanger Support Team</p>
//         </div>
//     `;

//     await sendEmail(email, 'Your Flowchanger Account Details', message);
// };


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

    const message = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2>Your OTP Code</h2>
            <p>Hello,</p>
            <p>Your OTP code is: <strong>${otp}</strong></p>
            <p>This code is valid for 5 minutes. Please do not share it with anyone.</p>
            <p>Regards,<br/>Flowchanger Support Team</p>
        </div>
    `;
    await sendEmail(email, 'Your OTP Code', message);
};



// Verification link email template
const sendVerificationLinkEmail = async (email, link) => {
    const message = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2>Verify Your Account</h2>
            <p>Hello,</p>
            <p>Click the link below to verify your account:</p>
            <a href="${link}" style="display:inline-block; padding:10px 20px; background-color:#532D94; color:#fff; text-decoration:none; border-radius:5px;">Verify Account</a>
            <p>If you did not sign up, you can safely ignore this email.</p>
            <p>Regards,<br/>Flowchanger Support Team</p>
        </div>
    `;
    await sendEmail(email, 'Verify Your Account', message);
};

// General message email template
const sendGeneralMessage = async (email, subject, content) => {
    const message = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <p>${content}</p>
            <p>Regards,<br/>Flowchanger Support Team</p>
        </div>
    `;
    await sendEmail(email, subject, message);
};

const sendPasswordResetAndForgotEmail = async (email, name, resetToken, type) => {
    try {
        const resetLink = `${process.env.FRONTEND_URL}/restore-password?token=${resetToken}&email=${email}`;

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

// send email to selected staff and customers

const sendSelectedStaffCustomers = async (emails) => {
    try {
        const subject = "Project Created - Flow Changer Agency";
        const text = `Hello,\n\nA new project has been created for you. Please check your dashboard for details.\n\nBest Regards,\nFlow Changer Agency`;

        const message = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h3 style="color: #000000;">Dear Team Members,</h3>
                <p>A new project has been assigned to you. Please log in to your dashboard to review the details.</p>
                <p>Thank you for being a part of Flow Changer Agency.</p>
                <br>
                <p>Best Regards,<br>Flow Changer Agency</p>
            </div>
        `;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: emails.join(","), // Ensures emails are properly formatted
            subject,
            text,
            html: message,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Emails sent successfully:", info.messageId);

        return { success: true };
    } catch (error) {
        console.error("Error sending email:", error);
        return { success: false, error: error.message };
    }
};


const sendInviteToAdminMail = async (email) => {
    try {
        const signupLink = process.env.FRONTEND_URL + "/signup";
        const subject = "Welcome to Flow Changer Agency";
        const text = `Hello, ${email}\n\n you have been invited to join Flow Changer Agency. Please sign up using the provided link.\n\n${signupLink}`;

        const message = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h3 style="color: #532D94;">You are Invited to Flow Changer Agency</h3>            
                <p> Hello, <span style="color: #000 !important;">${email}</span> <br><br>
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
    // sendLoginCredentialsEmail,
    sendEmailWithPdf,
    sendSelectedStaffCustomers
};
