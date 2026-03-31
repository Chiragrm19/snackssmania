require('dotenv').config({ path: '.env' });
const { Client } = require('pg');

async function migrate() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();
        
        // Check if column exists
        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='tables' AND column_name='parent_table_id';
        `);
        
        if (res.rows.length === 0) {
            console.log("Adding parent_table_id column...");
            await client.query(`
                ALTER TABLE tables
                ADD COLUMN parent_table_id integer REFERENCES tables(id) ON DELETE SET NULL;
            `);
            console.log("Column added.");
        } else {
            console.log("Column already exists.");
        }
    } catch(e) {
        console.error("Migration failed:", e);
    } finally {
        await client.end();
    }
}

migrate();
