import {
  parse,
  validate,
  execute,
  specifiedRules,
  validateSchema,
} from "graphql";
import schema from "./schema.mjs";

const operationA = {
  query: /* GraphQL */ `
    query {
      books
        title
        author {
          name
        }
      }
    }
  `,
};

const operationB = {
  query: /* GraphQL */ `
    query {
      books {
        title
        author {
          title
        }
      }
    }
  `,
};

const operationC = {
  query: /* GraphQL */ `
    subscription {
      books {
        title
        author {
          name
        }
      }
    }
  `,
};

const operationD = {
  query: /* GraphQL */ `
    query {
      books {
        title
        author {
          name
        }
      }
    }
  `,
};

const exampleOperation = operationA;

function createContextValue() {
  return {
    // ...
  };
}

async function runExampleOperation(operation) {
  // Step 1: Parse.
  // https://graphql.org/graphql-js/language/#parse
  let document;
  try {
    document = parse(operation.query);
  } catch (error) {
    console.log("Failed to parse query.");
    return console.log(error);
  }

  // Step 2: Validate query.
  // https://graphql.org/graphql-js/validation/#validate
  // GraphQL defaults:
  const rules = specifiedRules;
  // Extend with custom rules:
  // const rules = [
  //   ...specifiedRules,
  //   // custom rules
  // ];

  // Uses `specifiedRules` by default if not provided.
  const validationErrors = validate(schema, document, rules);
  if (validationErrors.length > 0) {
    console.log("Query is invalid.");
    return console.log(validationErrors);
  }

  // Step 3: Execute.
  // https://graphql.org/graphql-js/execution/#execute
  const response = await execute({
    schema,
    document,
    // Optional:
    operationName: operation.operationName,
    variableValues: operation.variables,
    contextValue: createContextValue(),
  });

  // Execution errors.
  if (response.errors) {
    console.log("Execution error!");
    console.log(response.errors);
  }

  console.log(JSON.stringify(response, null, 2));
}

// Validate the schema once on startup,
// `parse` function also asserts a valid schema.
const schemaValidationErrors = validateSchema(schema);
if (schemaValidationErrors.length > 0) {
  console.log("Invalid schema!", schemaValidationErrors);
} else {
  runExampleOperation(exampleOperation);
}
