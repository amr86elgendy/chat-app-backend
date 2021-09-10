const { UserInputError, AuthenticationError } = require('apollo-server');
const User = require('../../models/user');
const Message = require('../../models/message');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pkg = require('validator');
const { isEmail } = pkg;

module.exports = {
  Query: {
    getUsers: async (_, __, { user }) => {
      try {
        if (!user) throw new AuthenticationError('Unauthenticated');
        let users = await User.find().where({
          username: { $ne: user.username },
        });

        const allUserMessages = await Message.find({
          $or: [{ from: user.username }, { to: user.username }],
        }).sort({ createdAt: 'desc' });
        
        users = users.map((otherUser) => {
          const latestMessage = allUserMessages.find(
            (m) => m.from === otherUser.username || m.to === otherUser.username
          );
          otherUser.latestMessage = latestMessage;
          return otherUser;
        });

        return users;
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
    login: async (_, args) => {
      const { username, password } = args;
      let errors = {};

      try {
        if (username.trim() === '')
          errors.username = 'username must not be empty';
        if (password === '') errors.password = 'password must not be empty';

        if (Object.keys(errors).length > 0) {
          throw new UserInputError('bad input', { errors });
        }

        const user = await User.findOne({ username });

        if (!user) {
          errors.username = 'user not found';
          throw new UserInputError('user not found', { errors });
        }

        const correctPassword = await bcrypt.compare(password, user.password);

        if (!correctPassword) {
          errors.password = 'password is incorrect';
          throw new AuthenticationError('password is incorrect', { errors });
        }

        const token = jwt.sign({ username }, process.env.JWT_SECRET, {
          expiresIn: 60 * 60,
        });

        return {
          ...user._doc,
          createdAt: user.createdAt.toISOString(),
          token,
        };
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
  },
  Mutation: {
    register: async (_, args) => {
      let { username, email, password, confirmPassword } = args;
      let errors = {};

      try {
        // Validate input data
        if (!isEmail(email)) errors.email = 'Please enter a valid email';
        if (email.trim() === '') errors.email = 'email must not be empty';
        if (username.trim() === '')
          errors.username = 'username must not be empty';
        if (password.trim() === '')
          errors.password = 'password must not be empty';
        if (confirmPassword.trim() === '')
          errors.confirmPassword = 'repeat password must not be empty';

        if (password !== confirmPassword)
          errors.confirmPassword = 'passwords must match';

        // Check if username / email exists
        const userByUsername = await User.findOne({ username });
        const userByEmail = await User.findOne({ email });

        if (userByUsername) errors.username = 'Username is taken';
        if (userByEmail) errors.email = 'Email is taken';

        if (Object.keys(errors).length > 0) {
          throw errors;
        }

        // Hash password
        password = await bcrypt.hash(password, 6);

        // Create user
        const user = await User.create({
          username,
          email,
          password,
        });

        // Generate Token
        const token = jwt.sign({ username }, process.env.JWT_SECRET, {
          expiresIn: 60 * 60,
        });

        // Return user
        return {
          ...user._doc,
          createdAt: user.createdAt.toISOString(),
          token,
        };
      } catch (err) {
        // console.log(err);
        throw new UserInputError('Errors', { errors: err });
      }
    },
  },
};
