import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";
import authors from "../data/authors.mjs";
import AuthorType from "./Author.mjs";

const BookType = new GraphQLObjectType({
  name: "Book",
  description: "A book.",
  fields() {
    return {
      title: {
        type: new GraphQLNonNull(GraphQLString),
        description: "The books's title.",
      },
      author: {
        type: new GraphQLNonNull(AuthorType),
        description: "The author of this book.",
        resolve(book) {
          return authors.find((author) => {
            return author.id === book.authorId;
          });
        },
      },
    };
  },
});

export default BookType;
