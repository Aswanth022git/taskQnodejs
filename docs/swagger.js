const swaggerJsdoc = require("swagger-jsdoc");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "TaskQ Node API",
            version: "1.0.0",
            description: "API documentation for TaskQ Node backend"
        },
        servers: [
            {
                url: "http://localhost:5000/api",
                description: "Local server"
            },
            {
                url: "https://taskq-api.onrender.com/api",
                description: "Render server"
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        }
    },
    apis: ["./routes/*.js"]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;