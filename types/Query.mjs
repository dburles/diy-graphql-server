import { GraphQLObjectType } from "graphql";
import authors from "../queries/authors.mjs";
import books from "../queries/books.mjs";

const QueryType = new GraphQLObjectType({
  name: "Query",
  fields() {
    return {
      authors,
      books,
    };
  },
});

export default QueryType;
