const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../frontend/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .limit(1);
    
    if (error) {
        console.error('Error:', error);
    } else {
        if (data.length > 0) {
            console.log('Columns:', Object.keys(data[0]));
        } else {
            console.log('No data, inserting a dummy order to check schema...');
            const { error: insertError, data: insertData } = await supabase.from('orders').insert({
                table_id: 1,
                items: [],
                total: 0,
                status: 'test'
            }).select();
            if (insertError) {
                console.error('Insert error (might reveal schema):', insertError);
            } else {
                console.log('Columns:', Object.keys(insertData[0]));
                await supabase.from('orders').delete().eq('id', insertData[0].id);
            }
        }
    }
}

checkSchema();
