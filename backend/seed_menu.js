require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

const menuItems = [
    // Momos
    { name: 'Veg Momos', price: 79, category: 'food', emoji: '🥟', is_veg: true, is_signature: false, discount_pct: 0, description: 'Steamed veg momos' },
    { name: 'Veg Cheese Momos', price: 99, category: 'food', emoji: '🥟', is_veg: true, is_signature: false, discount_pct: 0, description: 'Steamed veg momos with cheese' },
    { name: 'Veg Fry Momos', price: 99, category: 'food', emoji: '🥟', is_veg: true, is_signature: false, discount_pct: 0, description: 'Crispy fried veg momos' },
    { name: 'Veg Schezwan Momos', price: 119, category: 'food', emoji: '🥟', is_veg: true, is_signature: false, discount_pct: 0, description: 'Spicy schezwan veg momos' },
    { name: 'Veg Peri Peri Fry Momos', price: 119, category: 'food', emoji: '🥟', is_veg: true, is_signature: false, discount_pct: 0, description: 'Peri peri spiced fried veg momos' },
    { name: 'Veg Crispy Momos', price: 129, category: 'food', emoji: '🥟', is_veg: true, is_signature: false, discount_pct: 0, description: 'Extra crispy veg momos' },
    { name: 'Panner Momos', price: 99, category: 'food', emoji: '🥟', is_veg: true, is_signature: false, discount_pct: 0, description: 'Classic panner momos' },
    { name: 'Panner Cheese Momos', price: 119, category: 'food', emoji: '🥟', is_veg: true, is_signature: false, discount_pct: 0, description: 'Panner momos with cheese' },
    { name: 'Panner Fry Momos', price: 129, category: 'food', emoji: '🥟', is_veg: true, is_signature: false, discount_pct: 0, description: 'Crispy fried panner momos' },
    { name: 'Panner Schezwan Momos', price: 129, category: 'food', emoji: '🥟', is_veg: true, is_signature: false, discount_pct: 0, description: 'Spicy schezwan panner momos' },
    { name: 'Panner Peri Peri Fry Mo.', price: 129, category: 'food', emoji: '🥟', is_veg: true, is_signature: false, discount_pct: 0, description: 'Peri peri fried panner momos' },
    { name: 'Panner Crispy Momos', price: 139, category: 'food', emoji: '🥟', is_veg: true, is_signature: false, discount_pct: 0, description: 'Extra crispy panner momos' },
    { name: 'Pizza Momos', price: 149, category: 'food', emoji: '🍕', is_veg: true, is_signature: true, discount_pct: 0, description: 'Pizza flavoured momos' },

    // Chinees
    { name: 'Manchuriyan Dry', price: 149, category: 'food', emoji: '🍜', is_veg: true, is_signature: false, discount_pct: 0, description: 'Dry manchurian' },
    { name: 'Panner Chilli', price: 169, category: 'food', emoji: '🌶️', is_veg: true, is_signature: false, discount_pct: 0, description: 'Panner chilli dry' },
    { name: 'Panner 65', price: 179, category: 'food', emoji: '🧆', is_veg: true, is_signature: false, discount_pct: 0, description: 'Crispy panner 65' },
    { name: 'Veg Lolipop', price: 179, category: 'food', emoji: '🍢', is_veg: true, is_signature: false, discount_pct: 0, description: 'Veg lollipop' },
    { name: 'Veg Springer', price: 199, category: 'food', emoji: '🌿', is_veg: true, is_signature: false, discount_pct: 0, description: 'Veg spring rolls' },
    { name: 'Panner Sate', price: 199, category: 'food', emoji: '🍢', is_veg: true, is_signature: false, discount_pct: 0, description: 'Panner satay skewers' },

    // Rice
    { name: 'Fries Rice', price: 129, category: 'food', emoji: '🍚', is_veg: true, is_signature: false, discount_pct: 0, description: 'Vegetable fried rice' },
    { name: 'Shzwan Fried Rice', price: 149, category: 'food', emoji: '🍚', is_veg: true, is_signature: false, discount_pct: 0, description: 'Spicy schezwan fried rice' },
    { name: 'Manchuriyan Rice', price: 169, category: 'food', emoji: '🍚', is_veg: true, is_signature: false, discount_pct: 0, description: 'Manchurian fried rice combo' },
    { name: 'Triple Fried Rice', price: 199, category: 'food', emoji: '🍚', is_veg: true, is_signature: true, discount_pct: 0, description: 'Three flavours combined fried rice' },
    { name: 'Veg Pulav', price: 139, category: 'food', emoji: '🍛', is_veg: true, is_signature: false, discount_pct: 0, description: 'Aromatic veg pulav' },
    { name: 'Panner Pulav', price: 149, category: 'food', emoji: '🍛', is_veg: true, is_signature: false, discount_pct: 0, description: 'Panner pulav' },

    // Maggi
    { name: 'Masala Maggi', price: 49, category: 'food', emoji: '🍝', is_veg: true, is_signature: false, discount_pct: 0, description: 'Classic masala maggi' },
    { name: 'Tadaka Maggi', price: 59, category: 'food', emoji: '🍝', is_veg: true, is_signature: false, discount_pct: 0, description: 'Tadka style maggi' },
    { name: 'Soup Maggi', price: 69, category: 'food', emoji: '🍜', is_veg: true, is_signature: false, discount_pct: 0, description: 'Soupy maggi' },

    // Fries
    { name: 'French Fries', price: 89, category: 'food', emoji: '🍟', is_veg: true, is_signature: false, discount_pct: 0, description: 'Classic french fries' },
    { name: 'Periperi French Fries', price: 99, category: 'food', emoji: '🍟', is_veg: true, is_signature: false, discount_pct: 0, description: 'Peri peri spiced french fries' },
    { name: 'Loaded Cheese Fries', price: 119, category: 'food', emoji: '🧀', is_veg: true, is_signature: true, discount_pct: 0, description: 'Fries loaded with cheese' },
    { name: 'Potato Fries', price: 99, category: 'food', emoji: '🥔', is_veg: true, is_signature: false, discount_pct: 0, description: 'Potato wedge fries' },

    // Pav Bhaji
    { name: 'Misal Pav', price: 69, category: 'food', emoji: '🫕', is_veg: true, is_signature: false, discount_pct: 0, description: 'Spicy misal with pav' },
    { name: 'Amul Pav Bhaji', price: 89, category: 'food', emoji: '🫕', is_veg: true, is_signature: false, discount_pct: 0, description: 'Buttery amul pav bhaji' },
    { name: 'Kholapuri Pav Bhaji', price: 99, category: 'food', emoji: '🫕', is_veg: true, is_signature: false, discount_pct: 0, description: 'Spicy Kolhapuri style pav bhaji' },
    { name: 'Panner Pav Bhaji', price: 119, category: 'food', emoji: '🫕', is_veg: true, is_signature: false, discount_pct: 0, description: 'Panner pav bhaji' },
    { name: 'Cheese Pav Bhaji', price: 119, category: 'food', emoji: '🫕', is_veg: true, is_signature: true, discount_pct: 0, description: 'Cheesy pav bhaji' },
    { name: 'Chola Bhature', price: 99, category: 'food', emoji: '🫓', is_veg: true, is_signature: false, discount_pct: 0, description: 'Spicy chole with bhature' },

    // Coffee / Drinks
    { name: 'Cold Coffee (Half)', price: 29, category: 'cold', emoji: '☕', is_veg: true, is_signature: false, discount_pct: 0, description: 'Half glass cold coffee' },
    { name: 'Cold Coffee (Full)', price: 49, category: 'cold', emoji: '☕', is_veg: true, is_signature: false, discount_pct: 0, description: 'Full glass cold coffee' },
    { name: 'Cold With Crush', price: 69, category: 'cold', emoji: '🧃', is_veg: true, is_signature: false, discount_pct: 0, description: 'Cold coffee with fruit crush' },
    { name: 'Lemon Mint Mojito', price: 79, category: 'cold', emoji: '🍋', is_veg: true, is_signature: false, discount_pct: 0, description: 'Refreshing lemon mint mojito' },
    { name: 'Blue Caraca Mojito', price: 99, category: 'cold', emoji: '🫐', is_veg: true, is_signature: true, discount_pct: 0, description: 'Blue curacao mojito' },
    { name: 'Soft Drink', price: 19, category: 'cold', emoji: '🥤', is_veg: true, is_signature: false, discount_pct: 0, description: 'Chilled soft drink' },
    { name: 'Mango Milkshake', price: 99, category: 'cold', emoji: '🥭', is_veg: true, is_signature: false, discount_pct: 0, description: 'Fresh mango milkshake' },
    { name: 'Sitafal Milkshake', price: 119, category: 'cold', emoji: '🍈', is_veg: true, is_signature: true, discount_pct: 0, description: 'Custard apple milkshake' },
    { name: 'Chocolate Milkshake', price: 99, category: 'cold', emoji: '🍫', is_veg: true, is_signature: false, discount_pct: 0, description: 'Rich chocolate milkshake' },
    { name: 'Rose Milkshake', price: 79, category: 'cold', emoji: '🌹', is_veg: true, is_signature: false, discount_pct: 0, description: 'Rose flavoured milkshake' },
    { name: 'Strawberry Milkshake', price: 79, category: 'cold', emoji: '🍓', is_veg: true, is_signature: false, discount_pct: 0, description: 'Fresh strawberry milkshake' },
    { name: 'Dudh Cold Drink', price: 49, category: 'cold', emoji: '🥛', is_veg: true, is_signature: false, discount_pct: 0, description: 'Chilled flavoured milk drink' },
];

async function seedMenu() {
    console.log(`Inserting ${menuItems.length} menu items...`);
    
    // Clear existing items first
    const { error: deleteError } = await supabase.from('menu_items').delete().neq('id', 0);
    if (deleteError) {
        console.error('Error clearing existing menu:', deleteError.message);
        return;
    }
    console.log('Cleared existing menu items.');

    const { data, error } = await supabase.from('menu_items').insert(menuItems).select();
    if (error) {
        console.error('Error inserting menu:', error.message);
    } else {
        console.log(`✅ Successfully inserted ${data.length} menu items!`);
    }
}

seedMenu();
