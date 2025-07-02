const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql2");

const app = express();
const port = 3000;

app.use(cors()); 
app.use(bodyParser.json()); 
const db = mysql.createConnection({
  host: "ramchin-course.cr2ue6u44sny.eu-north-1.rds.amazonaws.com",
  user: "admin",
  password: "Ramchin123",
  database: "course",
});


app.post("/register", (req, res) => {
  const { name, email, mobile, courseName, amount, paymentStatus } = req.body;

  // Check required fields
  if (!name || !email || !mobile || !courseName || !amount || !paymentStatus) {
    return res.status(400).json({ success: false, message: "Missing required fields." });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: "Invalid email format." });
  }

  // Mobile validation (India format)
  if (!/^[6-9]\d{9}$/.test(mobile)) {
    return res.status(400).json({ success: false, message: "Invalid mobile number." });
  }

  if (parseFloat(amount) <= 0) {
    return res.status(400).json({ success: false, message: "Amount must be greater than zero." });
  }

  // SQL INSERT
  const sql = `INSERT INTO registrations (name, email, mobile, course_name, amount, payment_status)
               VALUES (?, ?, ?, ?, ?, ?)`;

  db.query(sql, [name, email, mobile, courseName, amount, paymentStatus], (err, result) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ success: false, message: "Database error while executing." });
    }

    res.json({
      success: true,
      message: "Registration saved.",
      id: result.insertId,
    });
  });
});
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
