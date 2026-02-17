import { initializeDatabase } from './database.js';

(async () => {
    try {
        console.log('Starting database initialization...');
        await initializeDatabase();
        console.log('Database initialization complete.');
    } catch (error) {
        console.error('Database initialization failed:', error);
        process.exit(1);
    }
})();
