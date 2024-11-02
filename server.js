const express = require('express');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit')
const nodemailer = require('nodemailer');
const formDropdownMap = require('./form-dropdown.json')
require('dotenv').config();

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use('/', express.static(__dirname + '/web'));

const emailLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5,
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
        if (numValue && formDropdownMap[field]) {
            // The first string in the list is the question
            convertedData[formDropdownMap[field][0]] = formDropdownMap[field][numValue];
        }
    }
    return convertedData;
}

app.post('/submit', emailLimiter, (req, res) => {
    const formData = req.body;

    if (!formData["full-name"] || !formData["phone-number"] || !formData["email"]) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }

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
