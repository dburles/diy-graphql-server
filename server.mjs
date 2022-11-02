import http from "http";
import {
  parse,
  validate,
  execute,
  specifiedRules,
  validateSchema,
} from "graphql";
import schema from "./schema.mjs";
import isPlainObject from "is-plain-obj";

const GRAPHQL_PORT = 4000;

function createContextValue({ req }) {
  return { req };
}

function validateOperation(operation) {
  if (!("query" in operation)) {
    throw new TypeError("GraphQL operation 'query' field is required");
  } else if (typeof operation.query !== "string") {
    throw new TypeError("GraphQL operation field 'query' must be a string");
  } else if (
    "variables" in operation &&
    !isPlainObject(operation.variables) &&
    operation.variables !== null
  ) {
    throw new TypeError(
      "GraphQL operation field 'variables' must be an object"
    );
  }
}

function respond(res, data) {
  const json = JSON.stringify(data);
  const chunk = Buffer.from(json, "utf8");
  res.setHeader("Content-Length", String(chunk.length));
  res.end(chunk);
}

// GraphQL over HTTP spec:
// https://github.com/graphql/graphql-over-http/blob/main/spec/GraphQLOverHTTP.md
const server = http.createServer((req, res) => {
  // For this demo we'll allow all origins, but you may wish to add restricted domains.
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Handle GraphQL `POST` requests:
  if (req.method === "POST" && req.url === "/graphql") {
    if (req.headers["content-type"] !== "application/json") {
      // Enforcing an "application/json" Content-Type header will prevent the server from executing
      // 'simple' requests, as requests containing an "application/json" content type are always preflighted by the browser.
      // This will prevent CSRF (a concern if using cookie based auth) and also avoid executing a GraphQL operation despite CORS failure.
      // https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#simple_requests
      return res
        .writeHead(400, "Content-Type header must be 'application/json'")
        .end();
    }

    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      let operation;

      try {
        operation = JSON.parse(body);
      } catch (error) {
        return res.writeHead(400, "Failed to parse JSON body").end();
      }

      try {
        validateOperation(operation);
      } catch (error) {
        return res.writeHead(400, error.message).end();
      }

      res.setHeader(
        "Content-Type",
        "application/graphql-response+json; charset=utf-8"
      );

      // Step 1: Parse.
      // https://graphql.org/graphql-js/language/#parse
      let document;
      try {
        document = parse(operation.query);
      } catch (error) {
        res.statusCode = 400;
        res.statusMessage = "GraphQL parse error";
        return respond(res, { errors: [error] });
      }

      // Step 2: Validate query.
      // https://graphql.org/graphql-js/validation/#validate
      const rules = specifiedRules; // GraphQL defaults:
      // Extend with custom rules:
      // const rules = [
      //   ...specifiedRules,
      //   // custom rules
      // ];

      // Uses `specifiedRules` by default if not provided.
      const validationErrors = validate(schema, document, rules);
      if (validationErrors.length > 0) {
        res.statusCode = 400;
        res.statusMessage = "GraphQL validation error";
        return respond(res, { errors: validationErrors });
      }

      // Step 3: Execute.
      // https://graphql.org/graphql-js/execution/#execute
      const response = await execute({
        schema,
        document,
        // Optional:
        operationName: operation.operationName,
        variableValues: operation.variables,
        contextValue: createContextValue({ req }),
      });

      // Execution errors.
      if (response.errors) {
        // Check type of error (instanceof checks), mask unexpected errors.
      }

      res.statusCode = 200;
      respond(res, response);
    });
    // Handle CORS preflight requests:
  } else if (req.method === "OPTIONS") {
    // Without an origin, it's an invalid request.
    if (!req.headers.origin) {
      return res.writeHead(400).end();
    }

    if (req.headers["access-control-request-headers"]) {
      // Allow all requested headers.
      res.setHeader(
        "Access-Control-Allow-Headers",
        req.headers["access-control-request-headers"]
      );
    }

    res
      .writeHead(204, {
        // Headers that may alter the preflight response. This is important for intermediate (CDN) cache.
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Vary
        Vary: "Origin, Access-Control-Request-Headers",
        // Request methods that the server supports.
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Methods
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        // Informs the browser to cache the results of the preflight request.
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Max-Age
        "Access-Control-Max-Age": "7200", // Chromium maximum age.
      })
      .end();
  } else {
    res.writeHead(404).end();
  }
});

server.on("listening", () => {
  console.log(`GraphQL server is running on port ${GRAPHQL_PORT}.`);
});

// Validate the schema once on startup,
// `parse` function also asserts a valid schema.
const schemaValidationErrors = validateSchema(schema);
if (schemaValidationErrors.length > 0) {
  console.log("Invalid schema!", schemaValidationErrors);
} else {
  server.listen(GRAPHQL_PORT);
}
