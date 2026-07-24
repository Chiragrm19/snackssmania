const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function runSetup() {
    const dbUrl = process.env.DATABASE_URL;
    console.log('Connecting to database...');

    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to new Supabase PostgreSQL database!');

        const sqlScript = fs.readFileSync(path.join(__dirname, 'setup_new_supabase_db.sql'), 'utf8');
        console.log('Running database setup & indexing script...');
        
        await client.query(sqlScript);
        console.log('✅ Database tables, RLS permissions, Realtime publications, and indexes created successfully!');

    } catch (err) {
        console.error('Error running setup:', err.message);
    } finally {
        await client.end();
    }
}

runSetup();
