import { notification } from "../models/index.js";

// Change all Notification.findAll to notification.findAll
export const getNotifications = async (req, res) => {
  try {
    const notifications = await notification.findAll({  // FIXED: lowercase
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    
    // Mark as read if needed
    const unreadNotifications = notifications.filter(n => !n.is_read);
    if (unreadNotifications.length > 0) {
      // You could mark as read here, or leave it for explicit marking
    }
    
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const note = await notification.findOne({  // FIXED: lowercase and variable name
      where: { 
        id: notificationId,
        user_id: req.user.id 
      }
    });
    
    if (!note) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    note.is_read = true;
    await note.save();
    
    res.json({ message: "Notification marked as read", notification: note });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await notification.update(
      { is_read: true },
      { where: { user_id: req.user.id, is_read: false } }
    );
    
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ message: "Failed to mark notifications as read" });
  }
};