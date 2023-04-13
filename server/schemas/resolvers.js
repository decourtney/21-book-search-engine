const { AuthenticationError } = require("apollo-server-express");
const { User } = require("../models");
const { signToken } = require("../utils/auth");

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      console.log("Query me: " + args);
      if (context.user) {
        return await User.findOne({
          $or: [
            { _id: context.user ? context.user.id : args.id },
            { username: args.username },
          ],
        });
      }
      throw new AuthenticationError("Cannot find a user with this id!");
    },
  },

  Mutation: {
    addUser: async (parent, args) => {
      const user = await User.create(args);
      const token = signToken(user);
      return { token, user };
    },
    // Locate user by email, verify passwords match,
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError("Login Resolver: Can't find this user");
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError("Wrong password!");
      }
      console.log(user);
      const token = signToken(user);

      return { token, user };
    },

    saveBook: async (parent, {book}, context) => {
      console.log("saveBook() called");
      if (context.user) {
        return (updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: book.bookId } },
          { new: true, runValidators: true }
        ));
      }
      throw new AuthenticationError("You need to be logged in!");
    },

    removeBook: async (parent, args, context) => {
      if (context.user) {
        return (updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId: args.bookId } } },
          { new: true }
        ));
      }
      throw new AuthenticationError("You need to be logged in!");
    },
  },
};

module.exports = resolvers;
