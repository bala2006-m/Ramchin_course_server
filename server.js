require('dotenv').config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const nodemailer = require("nodemailer");

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MySQL Connection with Promise wrapper
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
}).promise();

// Nodemailer setup with Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send email function
const sendEmail = async (to, subject, message) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text: message
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

// Register endpoint
app.post("/register", async (req, res) => {
  const { name, email, mobile, courseName, amount, paymentStatus } = req.body;

  // Validation
  if (!name || !email || !mobile || !courseName || !amount || !paymentStatus) {
    return res.status(400).json({ success: false, message: "Missing required fields." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: "Invalid email format." });
  }

  if (!/^[6-9]\d{9}$/.test(mobile)) {
    return res.status(400).json({ success: false, message: "Invalid Indian mobile number." });
  }

  if (parseFloat(amount) <= 0) {
    return res.status(400).json({ success: false, message: "Amount must be greater than zero." });
  }

  // Insert into database
  const sql = `INSERT INTO registrations (name, email, mobile, course_name, amount, payment_status)
               VALUES (?, ?, ?, ?, ?, ?)`;

  try {
    const [result] = await db.query(sql, [name, email, mobile, courseName, amount, paymentStatus]);

    // Send confirmation email
    await sendEmail(
      email,
      "Registration Confirmation",
      `Hello ${name},\n\nYou have successfully registered for ${courseName}.\nDetails:\nMobile: ${mobile}\nAmount: ₹${amount}\nPayment Status: ${paymentStatus}\n\nThank you!`
    );
await sendEmail(
      process.env.EMAIL_USER,
      "Registration Confirmation",
      ` Name:${name},\n\n successfully registered for ${courseName}.\nDetails:\nMobile: ${mobile}\nAmount: ₹${amount}\nPayment Status: ${paymentStatus}\n\nThank you!`
    );
    res.json({
      success: true,
      message: "Registration saved and email sent.",
      id: result.insertId
    });

  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ success: false, message: "Database or email error." });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
