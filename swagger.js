const swaggerAutogen = require('swagger-autogen')();

const doc = {
    info: {
        title: 'Univeristy API',
        description: 'An API for Univerity API'
    },
    host: 'localhost:3001',
    Schemes: ['http', 'https']
};

const outputFile = './swagger.json';
const endpointsFile = ['./src/routes/index.ts'];

// this will generate swagger.json
swaggerAutogen(outputFile, endpointsFile, doc);