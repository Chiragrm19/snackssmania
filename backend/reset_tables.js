const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../frontend/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetTables() {
    console.log('Resetting all tables to free...');
    const { data, error } = await supabase
        .from('tables')
        .update({ is_free: true })
        .neq('id', 0); // Update all

    if (error) {
        console.error('Error resetting tables:', error);
    } else {
        console.log('Tables reset successfully.');
    }

    // Also clear existing non-paid orders to ensure a clean slate if requested
    console.log('Clearing active orders...');
    const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .neq('status', 'paid');

    if (orderError) {
        console.error('Error clearing orders:', orderError);
    } else {
        console.log('Active orders cleared.');
    }
}

resetTables();
