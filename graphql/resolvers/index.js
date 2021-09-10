const userResolvers = require('./users');
const messageResolvers = require('./messages');
const Message = require('../../models/message');
const User = require('../../models/user');
const Reaction = require('../../models/reaction');

module.exports = {
  Message: {
    createdAt: (parent) => parent.createdAt.toISOString(),
  },
  Reaction: {
    createdAt: (parent) => parent.createdAt.toISOString(),
    message: async (parent) => await Message.findById(parent.message),
    user: async (parent) => await User.findById(parent.user),
  },
  Query: {
    ...userResolvers.Query,
    ...messageResolvers.Query,
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...messageResolvers.Mutation,
  },
  Subscription: {
    ...messageResolvers.Subscription,
  },
};
