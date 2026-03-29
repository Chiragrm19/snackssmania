
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './frontend/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Key missing in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCustomers() {
    console.log('Fetching customers...');
    const { data, error } = await supabase.from('customers').select('*');
    if (error) {
        console.error('Error fetching customers:', error);
    } else {
        console.log('Customers in database:', data);
    }
}

checkCustomers();
