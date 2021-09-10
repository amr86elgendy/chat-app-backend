
const { ApolloServer } = require('apollo-server-express');
const express = require('express');
const { createServer } = require('http');
const { execute, subscribe } = require('graphql');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { middlewareQM, middlewareSub } = require('./middleware');
const connectDb = require('./config/db');
const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');

require('dotenv').config();
const jwt = require('jsonwebtoken');
(async function () {
  const app = express();
  const httpServer = createServer(app);
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  const server = new ApolloServer({
    schema,
    plugins: [
      {
        async serverWillStart() {
          return {
            async drainServer() {
              subscriptionServer.close();
            },
          };
        },
      },
    ],
    context: middlewareQM,
  });

  const subscriptionServer = SubscriptionServer.create(
    {
      schema,
      execute,
      subscribe,
      onConnect: middlewareSub,
    },
    {
      server: httpServer,
      path: server.graphqlPath,
    }
  );

  await server.start();
  server.applyMiddleware({ app });

  await connectDb();

  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, () =>
    console.log(`Server is now running on http://localhost:${PORT}/graphql`)
  );
})();
