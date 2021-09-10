const { model, Schema } = require('mongoose');

const messageSchema = new Schema(
  {
    body: {
      type: String,
    },
    from: {
      type: String,
      required: true,
    },
    to: {
      type: String,
      required: true,
    },
    reactions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Reaction'
      },
    ],
  },
  { timestamps: true }
);

module.exports = model('Message', messageSchema);
