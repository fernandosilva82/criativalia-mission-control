// Vercel serverless entry point
const app = require('./api');

// Export for serverless (no app.listen)
module.exports = app;
