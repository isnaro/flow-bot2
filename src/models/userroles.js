const mongoose = require('mongoose');

// Define the schema for storing user roles
const userRolesSchema = new mongoose.Schema({
  userId: String,
  guildId: String,
  roles: [String],
});

module.exports = mongoose.model('UserRoles', userRolesSchema);
