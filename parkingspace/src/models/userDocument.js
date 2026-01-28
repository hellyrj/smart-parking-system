import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const UserDocument = sequelize.define("UserDocument", {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },

  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },

  document_type: {
    type: DataTypes.ENUM("id_card", "license", "ownership_proof", "business_license"),
    allowNull: false,
  },

  file_url: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },

  status: {
    type: DataTypes.ENUM("pending", "approved", "rejected"),
    defaultValue: "pending",
  },
  
  verified_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  
  verified_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
});

export default UserDocument;