const express = require('express');
const fs = require('fs');
const http = require('http');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const sanitizer = require('sanitizer');

const formDropdownMap = require('./form-dropdown.json')

require('dotenv').config();

const HTTP_PORT = 3000;

const RATELIMIT_TIME = 10 * 60 * 1000; // 10 minutes
const RATELIMIT_MAX_REQUESTS = 5;

const app = express();
app.use(bodyParser.json());
app.use('/', express.static(__dirname + '/web')); // Load the frontend into '/'

const emailLimiter = rateLimit({
    windowMs: RATELIMIT_TIME,
    max: RATELIMIT_MAX_REQUESTS,
    message: 'Too many requests from this IP, please try again later.'
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Convert the given form data into a a Hebrew JSON object using 'form-dropdown.json'
function convertToDisplayText(formData) {
    const convertedData = {
        "שם מלא": formData["full-name"],
        "מספר טלפון": formData["phone-number"],
        "אימייל": formData["email"]
    };
    for (const [field, value] of Object.entries(formData)) {
        // Values recieved from the HTML are an index to their answer in formDropdownMap
        const numValue = Number(value);
        const fieldMapList = formDropdownMap[field];
        if (numValue && fieldMapList && numValue > 0 && numValue < fieldMapList.length) {
            // The first string in the list is the question
            convertedData[fieldMapList[0]] = fieldMapList[numValue];
        }
    }
    return convertedData;
}

app.post('/submit', emailLimiter, (req, res) => {
    const formData = req.body;

    if (!formData["full-name"] || !formData["phone-number"] || !formData["email"]) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }

    // Avoid email XSS attacks
    formData["full-name"] = sanitizer.escape(formData["full-name"])
    formData["phone-number"] = sanitizer.escape(formData["phone-number"])
    formData["email"] = sanitizer.escape(formData["email"])

    const displayFormData = convertToDisplayText(formData);
    // Convert the data into a string to put in the email's content
    let emailContent = JSON.stringify(displayFormData, null, 2);
    emailContent = emailContent.slice(1, emailContent.length - 1)
    // console.log('Received form data:', emailContent);

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.RECIPIENT_EMAIL,
        subject: `New Message on your Website from "${formData['full-name']}"`,
        html: `<body dir="rtl"><p style="white-space: pre-line">נשלח טופס חדש באתר שלך:\n${emailContent}</p></body>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error sending email:', error);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            // console.log('Email sent:', info.response);
            res.status(200).json({ message: 'Form submitted successfully!' });
        }
    });

});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});