const { Client } = require('pg');

const dbUrl = 'postgresql://postgres:[CHETANburhade@1]@db.rwoaiivmttnrvobzwxgx.supabase.co:5432/postgres';

async function enableRealtime() {
    const client = new Client({
        connectionString: dbUrl,
    });

    try {
        await client.connect();
        console.log('Connected to database.');

        // Enable realtime for orders, tables, and customers
        await client.query('ALTER PUBLICATION supabase_realtime ADD TABLE orders;');
        console.log('Enabled realtime for orders table.');

        await client.query('ALTER PUBLICATION supabase_realtime ADD TABLE tables;');
        console.log('Enabled realtime for tables table.');

        await client.query('ALTER PUBLICATION supabase_realtime ADD TABLE customers;');
        console.log('Enabled realtime for customers table.');

    } catch (err) {
        if (err.message.includes('already exists') || err.message.includes('already in publication')) {
            console.log('Realtime might already be enabled for some tables. Ignoring error:', err.message);
        } else {
            console.error('Error enabling realtime:', err);
        }
    } finally {
        await client.end();
        console.log('Database connection closed.');
    }
}

enableRealtime();
