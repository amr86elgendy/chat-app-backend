const jwt = require('jsonwebtoken');
const { PubSub } = require('graphql-subscriptions');

const pubsub = new PubSub();

module.exports.middlewareQM = (context) => {
  if (context.req && context.req.headers.authorization) {
    const token = context.req.headers.authorization.split('Bearer ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
      context.user = decodedToken;
    });
  }

  context.pubsub = pubsub

  return context;
};

module.exports.middlewareSub = async (connectionParams, webSocket, context) => {
  if (connectionParams.Authorization) {
    const token = connectionParams.Authorization.split('Bearer ')[1];
    let currentUser;
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        currentUser = decodedToken;
      });
    }
    return { pubsub, currentUser };
  }
  throw new Error('Missing auth token!');
};
