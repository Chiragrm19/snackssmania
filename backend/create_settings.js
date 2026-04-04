require('dotenv').config({ path: '.env' });
const { Client } = require('pg');

async function migrate() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();
        
        console.log("Creating settings table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS settings (
                key text PRIMARY KEY,
                value jsonb NOT NULL,
                updated_at timestamp with time zone DEFAULT now()
            );
        `);
        
        // Insert default last_reset_time if it doesn't exist
        const now = new Date().toISOString();
        await client.query(`
            INSERT INTO settings (key, value)
            VALUES ('last_reset_time', $1)
            ON CONFLICT (key) DO NOTHING;
        `, [JSON.stringify(now)]);

        console.log("Settings table created and initialized.");
    } catch(e) {
        console.error("Migration failed:", e);
    } finally {
        await client.end();
    }
}

migrate();
