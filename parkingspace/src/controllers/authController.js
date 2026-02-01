import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const register = async (req, res) => {
  try {
    const { email, password, role = "user" } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    if (String(password).length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
   
    const user = await User.create({
      email,
      password: hashedPassword,
      role: role,
      verification_status: "verified"
    });

    res.status(201).json({
      message: "Registration successful. You can now login.",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user)
      return res.status(400).json({ message: "Invalid credentials" });

    // No email verification check - user is automatically verified
 

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        role: user.role
        
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

      res.json({ 
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        verification_status: user.verification_status
      }
    });
   
  } catch (err) {
    console.error("login error", err);
    res.status(500).json({ message: "Login failed" });
  }
};
