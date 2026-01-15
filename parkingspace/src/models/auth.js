const db = require("../db");

const User = {
  create({ email, password, token, expires }, callback) {
    const sql = `
      INSERT INTO users (email, password, verification_token, token_expires)
      VALUES (?, ?, ?, ?)
    `;
    db.query(sql, [email, password, token, expires], callback);
  },

  findByEmail(email, callback) {
    const sql = `SELECT * FROM users WHERE email = ?`;
    db.query(sql, [email], callback);
  },

  verifyByToken(token, callback) {
    const sql = `
      UPDATE users
      SET is_verified = true,
          verification_token = NULL,
          token_expires = NULL
      WHERE verification_token = ?
        AND token_expires > NOW()
    `;
    db.query(sql, [token], callback);
  }
};

module.exports = User;
