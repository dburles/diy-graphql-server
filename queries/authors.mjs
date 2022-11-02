import { GraphQLList, GraphQLNonNull } from "graphql";
import data from "../data/authors.mjs";
import AuthorType from "../types/Author.mjs";

const authors = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(AuthorType))),
  description: "List all authors.",
  resolve() {
    return data;
  },
};

export default authors;
