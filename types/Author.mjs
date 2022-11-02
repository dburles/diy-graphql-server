import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";
import books from "../data/books.mjs";
import BookType from "./Book.mjs";

const AuthorType = new GraphQLObjectType({
  name: "Author",
  description: "An author.",
  fields() {
    return {
      name: {
        type: new GraphQLNonNull(GraphQLString),
        description: "The author's name.",
      },
      books: {
        type: new GraphQLList(BookType),
        description: "A list of books relating to this author.",
        resolve(author) {
          return books.filter((book) => {
            return book.authorId === author.id;
          });
        },
      },
    };
  },
});

export default AuthorType;
