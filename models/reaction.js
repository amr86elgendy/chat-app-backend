const { model, Schema } = require('mongoose');

const reactionSchema = new Schema(
  {
    content: {
      type: String,
    },
    message: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = model('Reaction', reactionSchema);
