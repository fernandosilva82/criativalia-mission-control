const app = require('./api');

const PORT = process.env.PORT || 3456;

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║  CRIATIVALIA CONTROL PLANE                                 ║
║  Version 1.0.0                                             ║
╠════════════════════════════════════════════════════════════╣
║  Dashboard: http://localhost:${PORT}                        ║
║  API: http://localhost:${PORT}/api                          ║
╚════════════════════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    process.exit(0);
});
