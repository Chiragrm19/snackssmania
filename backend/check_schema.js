require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function addColumn() {
    console.log('Attempting to add takeaway_no column...');
    // Supabase client doesn't support ALTER TABLE directly. 
    // We would need the service role key or use the SQL editor.
    // However, I can try to insert an object with a new key and see if it sticks (jsonb columns handle this, but normal columns don't).
    
    // Let's check the current schema by fetching one order.
    const { data, error } = await supabase.from('orders').select('*').limit(1).single();
    if (error) {
        console.error('Error fetching order schema:', error);
    } else {
        console.log('Current order columns:', Object.keys(data));
    }
}

addColumn();
