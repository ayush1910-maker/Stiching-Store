import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "My API Documentation",
      version: "1.0.0",
      description: "All API endpoints for the PRIVEE_CLUB project",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },

    security: [
      {
        bearerAuth: []
      }
    ]
  },

  apis: ["./src/routes/*.js"], // make sure this path is correct
};

const swaggerSpec = swaggerJsDoc(options);

export { swaggerUi, swaggerSpec };