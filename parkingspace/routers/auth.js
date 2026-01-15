const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/User");
const transporter = require("../mailer");

const router = express.Router();

/* REGISTER */
router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Missing fields" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  User.create(
    { email, password: hashedPassword, token, expires },
    async (err) => {
      if (err)
        return res.status(400).json({ message: "User already exists" });

      const link = `http://localhost:3000/api/auth/verify/${token}`;

      await transporter.sendMail({
        to: email,
        subject: "Verify your email",
        html: `<a href="${link}">Verify your account</a>`
      });

      res.json({ message: "Verification email sent" });
    }
  );
});

/* VERIFY EMAIL */
router.get("/verify/:token", (req, res) => {
  User.verifyByToken(req.params.token, (err, result) => {
    if (result.affectedRows === 0)
      return res.status(400).send("Invalid or expired token");

    res.send("Email verified. You can log in.");
  });
});

/* LOGIN */
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  User.findByEmail(email, async (err, results) => {
    if (results.length === 0)
      return res.status(401).json({ message: "Invalid credentials" });

    const user = results[0];

    if (!user.is_verified)
      return res.status(403).json({ message: "Verify your email first" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // true in production
      sameSite: "strict"
    });

    res.json({ message: "Login successful" });
  });
});

module.exports = router;
