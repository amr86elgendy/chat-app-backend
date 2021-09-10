const {
  UserInputError,
  AuthenticationError,
  ForbiddenError,
} = require('apollo-server');
const { withFilter } = require('graphql-subscriptions');
const Message = require('../../models/message');
const User = require('../../models/user');
const Reaction = require('../../models/reaction');

module.exports = {
  Query: {
    getMessages: async (parent, { from }, { user }) => {
      try {
        if (!user) throw new AuthenticationError('Unauthenticated');

        const otherUser = await User.findOne({ username: from });
        if (!otherUser) throw new UserInputError('User not found');

        const usernames = [user.username, otherUser.username];

        const messages = await Message.find()
          .where({
            from: usernames,
            to: usernames,
          })
          .sort({ createdAt: 'desc' })
          .populate('reactions');

        return messages;
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
  },
  Mutation: {
    sendMessage: async (parent, { to, body }, { pubsub, user }) => {
      try {
        if (!user) throw new AuthenticationError('Unauthenticated');

        const recipient = await User.findOne({ username: to });

        if (!recipient) {
          throw new UserInputError('User not found');
        } else if (recipient.username === user.username) {
          throw new UserInputError('You cant message yourself');
        }

        if (body.trim() === '') {
          throw new UserInputError('Message is empty');
        }

        const message = await Message.create({
          from: user.username,
          to,
          body,
        });

        pubsub.publish('NEW_MESSAGE', { newMessage: message });

        return message;
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
    reactToMessage: async (_, { id, content }, { pubsub, user }) => {
      const reactions = ['❤️', '😆', '😯', '😢', '😡', '👍', '👎'];

      try {
        // Validate reaction content
        if (!reactions.includes(content)) {
          throw new UserInputError('Invalid reaction');
        }

        // Get user
        const username = user ? user.username : '';
        user = await User.findOne({ username });

        if (!user) throw new AuthenticationError('Unauthenticated');

        // Get message
        const message = await Message.findById(id);
        
        if (!message) throw new UserInputError('message not found');

        if (message.from !== user.username && message.to !== user.username) {
          throw new ForbiddenError('Unauthorized');
        }

        let reaction = await Reaction.findOne({
          message,
          user,
        });

        if (reaction) {
          // Reaction exists, update it
          reaction.content = content;
          await reaction.save();
        } else {
          // Reaction doesnt exists, create it
          reaction = await Reaction.create({
            message: message.id,
            user: user.id,
            content,
          });
          message.reactions.push(reaction);
          await message.save();
        }

        pubsub.publish('NEW_REACTION', { newReaction: reaction });

        return reaction;
      } catch (err) {
        throw err;
      }
    },
  },
  Subscription: {
    newMessage: {
      subscribe: withFilter(
        (_, __, { pubsub, currentUser }) => {
          if (!currentUser) throw new AuthenticationError('Unauthenticated');
          return pubsub.asyncIterator(['NEW_MESSAGE']);
        },
        ({ newMessage }, _, { currentUser }) => {
          if (
            newMessage.from === currentUser.username ||
            newMessage.to === currentUser.username
          ) {
            return true;
          }

          return false;
        }
      ),
    },
    newReaction: {
      subscribe: withFilter(
        (_, __, { pubsub, currentUser }) => {
          if (!currentUser) throw new AuthenticationError('Unauthenticated');
          return pubsub.asyncIterator('NEW_REACTION');
        },
        async ({ newReaction }, _, { currentUser }) => {
          const message = await Message.findById(newReaction.message);
          if (
            message.from === currentUser.username ||
            message.to === currentUser.username
          ) {
            return true;
          }

          return false;
        }
      ),
    },
  },
};
