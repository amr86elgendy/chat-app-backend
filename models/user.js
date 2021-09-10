const { model, Schema } = require('mongoose');

const userSchema = new Schema(
  {
    username: {
      type: String,
      unique: true,
    },
    email: {
      type: String,
      unique: true,
    },
    password: String,
    imageUrl: String,
  },
  { timestamps: true }
);

module.exports = model('User', userSchema);
