import { GraphQLSchema } from "graphql";
import QueryType from "./types/Query.mjs";

const schema = new GraphQLSchema({
  query: QueryType,
});

export default schema;
