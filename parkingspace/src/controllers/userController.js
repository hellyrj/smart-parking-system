import { User, UserDocument, activityLog } from "../models/index.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/documents";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `doc_${req.user.id}_${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg', 
      'image/jpg',
      'image/png',
      'image/gif'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPEG, PNG, GIF are allowed.'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Become an owner (request)
export const requestOwnerStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findByPk(userId);
    if (user.role === "owner") {
      return res.status(400).json({ 
        message: "You are already an owner" 
      });
    }
    
    // User becomes owner immediately in this system
    // but needs to upload documents for verification
    user.role = "owner";
    user.verification_status = "pending";
    await user.save();
    
    await activityLog.create({
      user_id: userId,
      action: "Requested owner status"
    });
    
    res.json({
      message: "Owner status requested. Please upload required documents.",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        verification_status: user.verification_status
      }
    });
    
  } catch (error) {
    console.error("Request owner error:", error);
    res.status(500).json({ message: "Failed to request owner status" });
  }
};

// Upload documents
export const uploadDocument = [
  upload.single('document'),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { document_type } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      if (!document_type) {
        return res.status(400).json({ message: "Document type is required" });
      }
      
      const document = await UserDocument.create({
        user_id: userId,
        document_type,
        file_url: `/uploads/documents/${req.file.filename}`,
        status: "pending"
      });
      
      await activityLog.create({
        user_id: userId,
        action: `Uploaded ${document_type} document`
      });
      
      res.status(201).json({
        message: "Document uploaded successfully",
        document
      });
      
    } catch (error) {
      console.error("Upload document error:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  }
];

// Get my documents
export const getMyDocuments = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const documents = await UserDocument.findAll({
      where: { user_id: userId },
      order: [['createdAt', 'DESC']]
    });
    
    res.json(documents);
  } catch (error) {
    console.error("Get documents error:", error);
    res.status(500).json({ message: "Failed to get documents" });
  }
};

// Get my profile with verification status
export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findByPk(userId, {
      attributes: [
        'id', 'email', 'role', 'verification_status',
        'subscription_status', 'subscription_expiry',
        'phone_number', 'createdAt'
      ],
      include: [{
        model: UserDocument,
        as: 'documents',
        required: false
      }]
    });
    
    res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Failed to get profile" });
  }
};

// Update profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { phone_number } = req.body;
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Only allow updating certain fields
    const updates = {};
    if (phone_number !== undefined) updates.phone_number = phone_number;
    
    await user.update(updates);
    
    await activityLog.create({
      user_id: userId,
      action: "Updated profile"
    });
    
    res.json({
      message: "Profile updated successfully",
      user: {
        id: user.id,
        email: user.email,
        phone_number: user.phone_number
      }
    });
    
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};