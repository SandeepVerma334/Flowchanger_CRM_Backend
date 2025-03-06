import fs from 'fs';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import { promisify } from 'util';


// Initialize Nodemailer Transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    }
});

// Core email sender function
const sendEmail = async (to, subject, htmlContent, attachments = []) => {
    const mailOptions = {
        from: `"Flowchanger Support" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html: htmlContent,
        attachments
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error(`Failed to send email to ${to}:`, error);
        throw error;
    }
};

// OTP Generator
const generateOtp = () => Math.floor(100000 + Math.random() * 900000);

// Send OTP Email
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

// Send Verification Link Email
const sendVerificationLinkEmail = async (email, link) => {
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2>Verify Your Account</h2>
            <p>Hello,</p>
            <p>Click the link below to verify your account:</p>
            <a href="${link}" style="padding:10px 20px; background-color:#007bff; color:#fff; text-decoration:none; border-radius:5px;">Verify Account</a>
            <p>If you did not sign up, you can safely ignore this email.</p>
            <p>Regards,<br/>Flowchanger Support Team</p>
        </div>
    `;

    await sendEmail(email, 'Verify Your Account', htmlContent);
};

// Send General Message
const sendGeneralMessage = async (email, subject, message) => {
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <p>${message}</p>
            <p>Regards,<br/>Flowchanger Support Team</p>
        </div>
    `;

    await sendEmail(email, subject, htmlContent);
};

// Send Login Credentials Email (Plain Email without PDF)
const sendLoginCredentialsEmail = async (email, password, loginLink) => {
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2>Your Account Details</h2>
            <p>Hello,</p>
            <p>Your account has been created successfully. Below are your login credentials:</p>
            <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
                <tr><td style="padding: 10px; border: 1px solid #ddd;"><strong>Email:</strong></td><td>${email}</td></tr>
                <tr><td style="padding: 10px; border: 1px solid #ddd;"><strong>Password:</strong></td><td>${password}</td></tr>
            </table>
            <p>You can log in using the button below:</p>
            <a href="${loginLink}" style="padding:10px 20px; background-color:#28a745; color:#fff; text-decoration:none; border-radius:5px;">Login Now</a>
            <p>Please change your password after logging in for security reasons.</p>
            <p>Regards,<br/>Flowchanger Support Team</p>
        </div>
    `;

    await sendEmail(email, 'Your Flowchanger Account Details', htmlContent);
};

const unlinkAsync = promisify(fs.unlink);

const sendEmailWithPdf = async (email, username, password, pdfPassword, loginLink) => {
    const filePath = `./${username}.pdf`;

    try {
        // Create PDF with password protection
        await generateEncryptedPdf(filePath, username, email, password, pdfPassword);

        // Read the generated PDF into a buffer
        const pdfBuffer = await fs.promises.readFile(filePath);

        // Email HTML content
        const htmlContent = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;">
    <h2 style="color: #007bff; font-size: 22px; margin-bottom: 15px;">Your Account Details</h2>
    <p style="font-size: 14px; margin: 0 0 10px;">Hello,</p>
    <p style="font-size: 14px; margin: 0 0 15px;">Your account has been created successfully. Below are your login credentials:</p>

    <table style="border-collapse: collapse; width: 100%; max-width: 100%; margin: 15px 0; border: 1px solid #ddd;">
        <tr>
            <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold;">Email:</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${email}</td>
        </tr>
        <tr>
            <td colspan="2" style="padding: 5px; text-align: center; background-color: #f1f1f1; font-weight: bold; color: #555;">──────────</td>
        </tr>
        <tr>
            <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold;">Username:</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${username}</td>
        </tr>
    </table>

    <p style="font-size: 14px; margin: 15px 0;">Your credentials are also attached in the PDF file.</p>

    <p style="font-size: 14px; margin: 10px 0; font-weight: bold; color: #d9534f;">
        🔒 The password to open the PDF file is your <strong>PAN Card Number</strong>.
    </p>

    <p style="font-size: 14px; margin: 15px 0;">You can log in using the button below:</p>

    <p style="text-align: center; margin: 20px 0;">
        <a href="${loginLink}" style="display: inline-block; padding: 12px 25px; background-color: #28a745; color: #fff; font-size: 14px; text-decoration: none; border-radius: 5px;">Login Now</a>
    </p>

    <p style="font-size: 14px; margin: 15px 0;">Please change your password after logging in for security reasons.</p>

    <p style="font-size: 14px; margin: 20px 0 0; color: #555;">
        Regards,<br/>
        <strong>Flowchanger Support Team</strong>
    </p>
</div>
        `;

        // Send the email with PDF attachment
        const mailOptions = {
            from: `"Flowchanger Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your Flowchanger Account Details (PDF Attached)',
            html: htmlContent,
            attachments: [
                {
                    filename: `${username}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        };

        await transporter.sendMail(mailOptions);

        console.log('Email with PDF sent successfully');

        // Cleanup the temporary file
        await unlinkAsync(filePath);

    } catch (error) {
        console.error('Failed to send email with PDF:', error);

        // Cleanup the temporary file if it exists
        try {
            await unlinkAsync(filePath);
        } catch (cleanupError) {
            console.warn(`Failed to delete temporary file: ${cleanupError.message}`);
        }

        throw error;
    }
};

const generateEncryptedPdf = (filePath, username, email, password, pdfPassword) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
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

        // Header Section (Like Letter Head)
        doc
            .fontSize(12)
            .fillColor('#6c757d')
            .text('Aggarwal colony - 8A,1st Floor, B Block, Nosegay School Road,', 140, 30, { align: 'right' })
            .text('Hanumangarh Rd, Sri Ganganagar, Rajasthan 335001', { align: 'right' })
            .moveDown(0.5)
            .text('Phone: +91 6378277791 | Email: flowchangeragency@gmail.com', { align: 'right' })
            .text('Website: www.flowchanger.com', { align: 'right' });

        doc.moveDown(3);

        // Title (Blue and Centered)
        doc
            .fillColor('#6c2eb9')
            .fontSize(18)
            .text('CONFIDENTIAL LOGIN CREDENTIALS', { align: 'center', underline: true });

        doc.moveDown(2);

        // Body Text
        doc.fillColor('black').fontSize(12);
        doc.text(`Dear ${username},`);
        doc.moveDown();
        doc.text('We are pleased to share your login credentials for accessing your Flowchanger account.');
        doc.moveDown();

        doc.font('Helvetica-Bold').text('Login Details:', { underline: true });
        doc.moveDown(0.5);
        doc.font('Helvetica').text(`Username: ${username}`, { indent: 20 });
        doc.text(`Password: ${password}`, { indent: 20 });

        doc.moveDown();
        doc.text('Please keep these credentials safe and do not share them with anyone.', { indent: 20 });
        doc.moveDown();
        doc.text('You can log in using the link below:', { indent: 20 });
        doc.fillColor('#007bff').text('https://app.flowchanger.com/login', { indent: 20, link: 'https://app.flowchanger.com/login' });

        doc.moveDown(1);
        doc.fillColor('black').text('If you have any issues logging in, feel free to contact our support team.', { indent: 20 });

        doc.moveDown(3);

        // Footer - Signature Section
        doc
            .font('Helvetica-Bold')
            .text('Warm regards,', { indent: 20 })
            .moveDown(0.5)
            .text('Pradeep Kumar', { indent: 20 })
            .text('Founder & CEO', { indent: 20 })
            .text('Flowchanger Digital Marketing Agency', { indent: 20 });

        doc.moveDown(1);
        doc
            .font('Helvetica')
            .text('Jasmine', { indent: 20 })
            .text('Human Resources', { indent: 20 });

        // Footer Contact Info
        doc
            .fontSize(10)
            .fillColor('#6c2eb9')
            .text('+91 6378277791 | www.flowchanger.com | flowchangeragency@gmail.com', 50, 770, { align: 'center' });

        // Watermark (Flowchanger Faint Text in Background)
        doc.fillColor('#f2f2f2');
        doc.fontSize(60).opacity(0.2);
        doc.rotate(45, { origin: [300, 400] }).text('Flowchanger', 100, 300);

        doc.end();

        stream.on('finish', resolve);
        stream.on('error', reject);
    });
};


export {
    sendEmailWithPdf, sendGeneralMessage,
    sendLoginCredentialsEmail, sendOtpEmail,
    sendVerificationLinkEmail
};

