const { gql } = require('apollo-server');

module.exports = gql`
  type User {
    id: ID!
    username: String!
    email: String
    createdAt: String!
    token: String
    imageUrl: String
    latestMessage: Message
  }
  type Message {
    id: ID!
    body: String!
    from: String!
    to: String!
    createdAt: String!
    reactions: [Reaction]
  }
  type Reaction {
    id: ID!
    content: String!
    createdAt: String!
    message: Message!
    user: User!
  }
  type Query {
    getUsers: [User]!
    login(username: String!, password: String!): User!
    getMessages(from: String!): [Message]!
  }
  type Mutation {
    register(
      username: String!
      email: String!
      password: String!
      confirmPassword: String!
    ): User!
    sendMessage(to: String!, body: String!): Message!
    reactToMessage(id: ID!, content: String!): Reaction!
  }
  type Subscription {
    newMessage: Message!
    newReaction: Reaction!
  }
`;
