import { Op } from "sequelize";
import {
  User,
  UserDocument,
  parkingSpace,
  parkingLocation,
  parkingImage,
  payment,
  parkingSession,
  activityLog,
  PaymentProof
} from "../models/index.js";

// User Management (now includes owners)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: [
        'id', 'email', 'role', 'verification_status', 
        'subscription_status', 'createdAt'
      ],
      include: [{
        model: UserDocument,
        as: 'documents',
        required: false
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    user.verification_status = status;
    await user.save();
    
    await activityLog.create({
      user_id: req.user.id,
      action: `Updated user status to ${status}`,
      target_user_id: id
    });
    
    res.json({ message: "User status updated" });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ message: "Failed to update user status" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    await user.destroy();
    
    await activityLog.create({
      user_id: req.user.id,
      action: "Deleted user",
      target_user_id: id
    });
    
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
};

// Get only owners (users with role 'owner')
export const getAllOwners = async (req, res) => {
  try {
    const owners = await User.findAll({
      where: { role: 'owner' },
      attributes: [
        'id', 'email', 'role', 'verification_status', 
        'subscription_status', 'createdAt'
      ],
      include: [
        {
          model: UserDocument,
          as: 'documents',
          required: false
        },
        {
          model: parkingSpace,
          as: 'ownedParkings',
          attributes: ['id', 'name', 'is_active', 'approval_status'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(owners);
  } catch (error) {
    console.error("Error fetching owners:", error);
    res.status(500).json({ message: "Failed to fetch owners" });
  }
};

// Verify user as owner
export const verifyOwner = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Update user role and verification status
    user.role = "owner";
    user.verification_status = "verified";
    await user.save();
    
    await activityLog.create({
      user_id: req.user.id,
      action: "Verified user as owner",
      target_user_id: id
    });
    
    res.json({ 
      message: "User verified as owner successfully",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        verification_status: user.verification_status
      }
    });
  } catch (error) {
    console.error("Error verifying owner:", error);
    res.status(500).json({ message: "Failed to verify owner" });
  }
};

// Reject owner verification
export const rejectOwner = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Keep role as 'owner' but mark as suspended
    user.verification_status = "suspended";
    await user.save();
    
    await activityLog.create({
      user_id: req.user.id,
      action: `Rejected owner verification: ${reason}`,
      target_user_id: id
    });
    
    res.json({ 
      message: "Owner verification rejected",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        verification_status: user.verification_status
      }
    });
  } catch (error) {
    console.error("Error rejecting owner:", error);
    res.status(500).json({ message: "Failed to reject owner" });
  }
};

// Get user documents
export const getUserDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    
    const documents = await UserDocument.findAll({
      where: { user_id: id },
      include: [{
        model: User,
        as: 'user',
        attributes: ['email']
      }],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ message: "Failed to fetch documents" });
  }
};

// Verify a specific document
export const verifyDocument = async (req, res) => {
  try {
    const { id } = req.params; // document id
    
    const document = await UserDocument.findByPk(id);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }
    
    document.status = "approved";
    document.verified_by = req.user.id;
    document.verified_at = new Date();
    await document.save();
    
    // Check if all required documents are approved
    const pendingDocs = await UserDocument.count({
      where: { 
        user_id: document.user_id,
        status: "pending"
      }
    });
    
    // If no pending docs, auto-verify user as owner
    if (pendingDocs === 0) {
      const user = await User.findByPk(document.user_id);
      if (user && user.role === "user") {
        user.role = "owner";
        user.verification_status = "verified";
        await user.save();
      }
    }
    
    await activityLog.create({
      user_id: req.user.id,
      action: "Approved user document",
      target_user_id: document.user_id
    });
    
    res.json({ 
      message: "Document approved successfully",
      document
    });
  } catch (error) {
    console.error("Error verifying document:", error);
    res.status(500).json({ message: "Failed to verify document" });
  }
};

// Reject a document
export const rejectDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const document = await UserDocument.findByPk(id);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }
    
    document.status = "rejected";
    document.verified_by = req.user.id;
    document.verified_at = new Date();
    await document.save();
    
    await activityLog.create({
      user_id: req.user.id,
      action: `Rejected document: ${reason}`,
      target_user_id: document.user_id
    });
    
    res.json({ 
      message: "Document rejected",
      document
    });
  } catch (error) {
    console.error("Error rejecting document:", error);
    res.status(500).json({ message: "Failed to reject document" });
  }
};

// Parking Space Approval - ADD THESE FUNCTIONS
export const getAllParkingSpaces = async (req, res) => {
  try {
    const parkings = await parkingSpace.findAll({
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'email', 'role', 'verification_status']
        },
        {
          model: parkingLocation,
          attributes: ['address', 'city', 'latitude', 'longitude'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(parkings);
  } catch (error) {
    console.error("Error fetching parking spaces:", error);
    res.status(500).json({ message: "Failed to fetch parking spaces" });
  }
};

// Review a specific parking submission (parking + images + owner + docs + payment proof)
export const getParkingSubmissionReview = async (req, res) => {
  try {
    const { id } = req.params;

    const parking = await parkingSpace.findByPk(id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'email', 'role', 'verification_status']
        },
        {
          model: parkingLocation,
          attributes: ['address', 'city', 'latitude', 'longitude'],
          required: false
        },
        {
          model: parkingImage,
          attributes: ['image_url'],
          required: false
        }
      ]
    });

    if (!parking) {
      return res.status(404).json({ message: 'Parking space not found' });
    }

    const ownerId = parking.owner_id;

    const [documents, paymentProofs] = await Promise.all([
      UserDocument.findAll({
        where: { user_id: ownerId },
        order: [['createdAt', 'DESC']]
      }),
      PaymentProof.findAll({
        where: { user_id: ownerId },
        order: [['createdAt', 'DESC']]
      })
    ]);

    res.json({
      parking,
      documents,
      paymentProofs
    });
  } catch (error) {
    console.error('Error fetching parking submission review:', error);
    res.status(500).json({ message: 'Failed to fetch submission review' });
  }
};

export const approveParkingSpace = async (req, res) => {
  try {
    const { id } = req.params;
    
    const parking = await parkingSpace.findByPk(id);

    if (!parking) {
      return res.status(404).json({ message: "Parking space not found" });
    }
    
    parking.approval_status = "approved";
    parking.is_active = true;
    await parking.save();

    // If parking is approved, also verify the owner (owner dashboard access)
    const owner = await User.findByPk(parking.owner_id);
    if (owner) {
      owner.role = 'owner';
      owner.verification_status = 'verified';
      await owner.save();
    }
    
    await activityLog.create({
      user_id: req.user.id,
      action: "Approved parking space",
      target_parking_id: id
    });
    
    res.json({
      message: "Parking space approved",
      parking: {
        id: parking.id,
        name: parking.name,
        approval_status: parking.approval_status,
        is_active: parking.is_active
      }
    });
  } catch (error) {
    console.error("Error approving parking space:", error);
    res.status(500).json({ message: "Failed to approve parking space" });
  }
};

export const rejectParkingSpace = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const parking = await parkingSpace.findByPk(id);
    if (!parking) {
      return res.status(404).json({ message: "Parking space not found" });
    }
    
    parking.approval_status = "rejected";
    parking.is_active = false;
    await parking.save();

    // If rejected, prevent owner access
    const owner = await User.findByPk(parking.owner_id);
    if (owner) {
      owner.role = 'user';
      owner.verification_status = 'suspended';
      await owner.save();
    }
    
    await activityLog.create({
      user_id: req.user.id,
      action: `Rejected parking space: ${reason}`,
      target_parking_id: id
    });
    
    res.json({ 
      message: "Parking space rejected",
      parking: {
        id: parking.id,
        name: parking.name,
        approval_status: parking.approval_status,
        is_active: parking.is_active
      }
    });
  } catch (error) {
    console.error("Error rejecting parking space:", error);
    res.status(500).json({ message: "Failed to reject parking space" });
  }
};

// Payment Verification - UPDATE THIS FUNCTION
export const verifyPayment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const paymentRecord = await payment.findByPk(id);
    if (!paymentRecord) {
      return res.status(404).json({ message: "Payment not found" });
    }
    
    // FIX: Use payment_status instead of status
    paymentRecord.payment_status = "paid";
    await paymentRecord.save();
    
    // If it's a subscription payment, update user subscription status
    // Note: You might need to add payment_type to your Payment model
    if (paymentRecord.payment_type === "subscription") {
      const user = await User.findByPk(paymentRecord.user_id);
      if (user) {
        user.subscription_status = "active";
        // Calculate expiry date (30 days from now)
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        user.subscription_expiry = expiryDate;
        await user.save();
      }
    }
    
    await activityLog.create({
      user_id: req.user.id,
      action: "Verified payment",
      target_payment_id: id
    });
    
    res.json({ 
      message: "Payment verified",
      payment: {
        id: paymentRecord.id,
        amount: paymentRecord.amount,
        payment_status: paymentRecord.payment_status
      }
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ message: "Failed to verify payment" });
  }
};

// Dashboard Statistics
export const getDashboardStats = async (req, res) => {
  try {
    console.log("Fetching dashboard stats...");
    
    const [
      totalUsers,
      totalOwners,
      totalParkings,
      activeSessions,
      pendingVerifications,
      pendingPayments,
      pendingDocuments,
      recentActivity,
      totalSubscriptionFees
    ] = await Promise.all([
      User.count(),
      User.count({ where: { role: 'owner' } }),
      parkingSpace.count(),
      parkingSession.count({ where: { end_time: null } }),
      parkingSpace.count({ where: { approval_status: 'pending' } }),
      payment.count({ where: { payment_status: "pending" } }),
      UserDocument.count({ where: { status: 'pending' } }),
      activityLog.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [{
          model: User,
          attributes: ['email']
        }]
      }),
      payment.sum('platform_fee', { where: { payment_status: 'paid' } })
    ]);
    
    console.log("Stats fetched successfully");
    
    res.json({
      stats: {
        totalUsers,
        totalOwners,
        totalParkings,
        activeSessions,
        pendingVerifications,
        pendingPayments,
        pendingDocuments,
        totalSubscriptionFees: Number(totalSubscriptionFees || 0).toFixed(2)
      },
      recentActivity
    });
  } catch (error) {
    console.error("❌ Error fetching dashboard stats:", error);
    res.status(500).json({ 
      message: "Failed to fetch dashboard stats",
      error: error.message 
    });
  }
};

// In adminController.js - ADD these new functions for payment management:

// Get all payment proofs for verification
export const getAllPaymentProofs = async (req, res) => {
  try {
    const paymentProofs = await PaymentProof.findAll({
      where: { status: 'pending' },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'name']
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json(paymentProofs);
  } catch (error) {
    console.error("Error fetching payment proofs:", error);
    res.status(500).json({ message: "Failed to fetch payment proofs" });
  }
};

// Verify payment proof with screenshot
export const verifyPaymentProof = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    const paymentProof = await PaymentProof.findByPk(id);
    if (!paymentProof) {
      return res.status(404).json({ message: "Payment proof not found" });
    }
    
    paymentProof.status = "verified";
    paymentProof.verified_by = req.user.id;
    paymentProof.verified_at = new Date();
    paymentProof.notes = notes;
    await paymentProof.save();
    
    // If this is a subscription payment, update user subscription
    if (paymentProof.payment_type === 'subscription') {
      const user = await User.findByPk(paymentProof.user_id);
      if (user) {
        user.subscription_status = 'active';
        user.subscription_expiry = new Date();
        user.subscription_expiry.setMonth(user.subscription_expiry.getMonth() + 1); // 1 month
        await user.save();
      }
    }
    
    await activityLog.create({
      user_id: req.user.id,
      action: `Verified payment proof for ${paymentProof.payment_type}`,
      target_user_id: paymentProof.user_id
    });
    
    res.json({ 
      message: "Payment proof verified successfully",
      paymentProof
    });
  } catch (error) {
    console.error("Error verifying payment proof:", error);
    res.status(500).json({ message: "Failed to verify payment proof" });
  }
};

// Reject payment proof
export const rejectPaymentProof = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const paymentProof = await PaymentProof.findByPk(id);
    if (!paymentProof) {
      return res.status(404).json({ message: "Payment proof not found" });
    }
    
    paymentProof.status = "rejected";
    paymentProof.verified_by = req.user.id;
    paymentProof.verified_at = new Date();
    paymentProof.notes = reason;
    await paymentProof.save();
    
    await activityLog.create({
      user_id: req.user.id,
      action: `Rejected payment proof: ${reason}`,
      target_user_id: paymentProof.user_id
    });
    
    res.json({ 
      message: "Payment proof rejected",
      paymentProof
    });
  } catch (error) {
    console.error("Error rejecting payment proof:", error);
    res.status(500).json({ message: "Failed to reject payment proof" });
  }
};