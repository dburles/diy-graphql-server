import { GraphQLList, GraphQLNonNull } from "graphql";
import data from "../data/books.mjs";
import BookType from "../types/Book.mjs";

const books = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(BookType))),
  description: "List all books.",
  resolve() {
    return data;
  },
};

export default books;
