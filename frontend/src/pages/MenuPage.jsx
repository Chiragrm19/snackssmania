import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import MenuCard from '../components/MenuCard';
import CartBar from '../components/CartBar';

const categories = [
    { id: 'all', name: 'All' },
    { id: 'coffee', name: 'Coffee' },
    { id: 'food', name: 'Food' },
    { id: 'dessert', name: 'Desserts' },
    { id: 'cold', name: 'Cold' }
];

const MenuPage = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [cart, setCart] = useState({});
    const [orderStatus, setOrderStatus] = useState(null); // 'submitting' | 'success'
    const [lastOrderId, setLastOrderId] = useState(null);
    const [displayOrderId, setDisplayOrderId] = useState(null);
    const [showThankYou, setShowThankYou] = useState(false);
    const [showReview, setShowReview] = useState(false);
    const wasOccupied = useRef(false); // Track if the table was ever occupied this session

    const location = useLocation();
    const tableId = new URLSearchParams(location.search).get('table') || '1';
    const isTakeaway = tableId === '0';

    useEffect(() => {
        if (!lastOrderId) return;

        const channel = supabase
            .channel(`order-status-${lastOrderId}`)
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${lastOrderId}` },
                (payload) => {
                    if (payload.new.status === 'paid') {
                        setShowThankYou(true);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [lastOrderId]);

    useEffect(() => {
        fetchMenu();
    }, []);

    useEffect(() => {
        if (isTakeaway) return; // Table-specific listeners only for dine-in
        
        // Check if the table is already occupied when the user loads the page
        const checkInitialStatus = async () => {
            const { data } = await supabase.from('tables').select('is_free').eq('id', tableId).single();
            if (data && data.is_free === false) {
                wasOccupied.current = true;
            }
        };
        checkInitialStatus();

        // 1. Real-time listener (High performance)
        const channel = supabase
            .channel(`table-status-${tableId}`)
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'tables', filter: `id=eq.${tableId}` },
                (payload) => {
                    console.log('Real-time table status changed:', payload.new);
                    // Only show thank you if it transitions FROM occupied TO free
                    if (payload.new.is_free === true && wasOccupied.current) {
                        setShowThankYou(true);
                    } else if (payload.new.is_free === false) {
                        wasOccupied.current = true;
                    }
                }
            )
            .subscribe();

        // 2. Polling Fallback (Backup if Realtime is disabled in Supabase)
        const pollInterval = setInterval(async () => {
            const { data } = await supabase
                .from('tables')
                .select('is_free')
                .eq('id', tableId)
                .single();

            if (data) {
                if (data.is_free === true && wasOccupied.current) {
                    setShowThankYou(true);
                    clearInterval(pollInterval);
                } else if (data.is_free === false) {
                    wasOccupied.current = true;
                }
            }
        }, 5000); // Check every 5 seconds

        return () => {
            supabase.removeChannel(channel);
            clearInterval(pollInterval);
        };
    }, [tableId]);

    const fetchMenu = async () => {
        try {
            const { data, error } = await supabase.from('menu_items').select('*');
            if (error) throw error;

            if (data) {
                setItems(data);
            }
        } catch (err) {
            console.error('Error fetching menu:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (item) => {
        setCart(prev => ({
            ...prev,
            [item.id]: {
                ...item,
                qty: (prev[item.id]?.qty || 0) + 1
            }
        }));
    };

    const removeFromCart = (id) => {
        setCart(prev => {
            const newCart = { ...prev };
            if (newCart[id].qty > 1) {
                newCart[id].qty -= 1;
            } else {
                delete newCart[id];
            }
            return newCart;
        });
    };

    const placeOrder = async () => {
        setOrderStatus('submitting');
        try {
            const cartItems = Object.values(cart);
            const cartTotal = cartItems.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);

            // Check for existing active order for this table
            const { data: existingOrder, error: fetchError } = await supabase
                .from('orders')
                .select('*')
                .eq('table_id', parseInt(tableId))
                .neq('status', 'paid')
                .maybeSingle();

            if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

            if (existingOrder) {
                // Clear any previous isNew flags from the existing items list first
                const updatedItems = existingOrder.items.map(item => ({ ...item, isNew: false }));
                
                cartItems.forEach(cartItem => {
                    const existingItemIndex = updatedItems.findIndex(i => i.id === cartItem.id || i.name === cartItem.name);
                    if (existingItemIndex > -1) {
                        updatedItems[existingItemIndex].qty += cartItem.qty;
                        updatedItems[existingItemIndex].isNew = true; // Flag as updated/new
                    } else {
                        updatedItems.push({ 
                            id: cartItem.id, 
                            name: cartItem.name, 
                            qty: cartItem.qty, 
                            price: cartItem.price,
                            isNew: true // Flag as new addition
                        });
                    }
                });

                const newTotal = existingOrder.total + cartTotal;

                const { error: updateError } = await supabase
                    .from('orders')
                    .update({
                        items: updatedItems,
                        total: newTotal,
                        status: 'new' // reset to new to alert admin
                    })
                    .eq('id', existingOrder.id);

                if (updateError) throw updateError;
            } else {
                // Insert brand new order
                let finalItems = cartItems.map(i => ({ 
                    id: i.id, 
                    name: i.name, 
                    qty: i.qty, 
                    price: i.price,
                    isNew: true 
                }));

                // For takeaway, calculate a separate number for today
                if (isTakeaway) {
                    const today = new Date().toISOString().split('T')[0];
                    const { count } = await supabase
                        .from('orders')
                        .select('*', { count: 'exact', head: true })
                        .eq('table_id', 0)
                        .gte('created_at', today);
                    
                    const takeawayNo = (count || 0) + 1;
                    // Prepend metadata item
                    finalItems = [{ type: 'METADATA', takeaway_no: takeawayNo }, ...finalItems];
                }

                const { data: newOrderData, error: insertError } = await supabase.from('orders').insert({
                    table_id: parseInt(tableId),
                    items: finalItems,
                    total: cartTotal,
                    status: 'new'
                }).select().single();
                
                if (insertError) throw insertError;
                if (newOrderData) {
                    setLastOrderId(newOrderData.id);
                    setDisplayOrderId(newOrderData.id);
                    // If metadata exists, extract it for display
                    const meta = newOrderData.items.find(i => i.type === 'METADATA');
                    if (meta) {
                        setDisplayOrderId(`TK-${meta.takeaway_no}`);
                    }
                }
            }

            setOrderStatus('success');
            setCart({});
        } catch (err) {
            console.error('Order failed:', err);
            alert('Order failed: ' + err.message);
            setOrderStatus(null);
        }
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const cartItemsArray = Object.values(cart);
    const cartCount = cartItemsArray.reduce((acc, curr) => acc + curr.qty, 0);
    const cartTotal = cartItemsArray.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);

    if (showThankYou) {
        return (
            <div className="container animate-fade" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '100vh', padding: '24px' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'var(--accent-white)', color: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '50px', marginBottom: '40px', boxShadow: '0 12px 48px rgba(255,255,255,0.3)' }}>
                    ✨
                </div>
                <h1 style={{ fontSize: '3rem', marginBottom: '16px', fontWeight: '700', letterSpacing: '-0.04em', lineHeight: '1.2' }}>Thank You.</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '48px', fontSize: '1.2rem', maxWidth: '300px', lineHeight: '1.5' }}>
                    We hope you enjoyed your time at snackssmania.
                </p>
                <div className="glass" style={{ padding: '32px', borderRadius: '24px', width: '100%', maxWidth: '400px', border: '1px solid var(--border-subtle)' }}>
                    <p style={{ fontSize: '1rem', color: 'var(--text-main)', letterSpacing: '0.02em', fontWeight: '500' }}>Please visit us again!</p>
                </div>
            </div>
        );
    }

    if (orderStatus === 'success') {
        return (
            <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '100vh', padding: '24px', background: 'var(--bg-dark)' }}>
                <div className="success-checkmark animate-float">✓</div>
                <h1 style={{ fontSize: '2.8rem', marginBottom: '12px', fontWeight: '800', letterSpacing: '-0.05em', background: 'linear-gradient(135deg, #fff 0%, #a0a0c0 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Order Placed.
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '40px', lineHeight: '1.6', fontWeight: '500', maxWidth: '280px' }}>
                    {isTakeaway
                        ? `Your order #${displayOrderId} is being prepared.`
                        : `Table ${tableId} — we're on it.`}
                </p>

                <div className="glass" style={{ padding: '28px 32px', borderRadius: '24px', width: '100%', maxWidth: '320px', marginBottom: '32px', borderTopColor: 'rgba(255,255,255,0.18)' }}>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700', marginBottom: '8px' }}>Estimated Wait</p>
                    <p style={{ fontSize: '2.4rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.04em', lineHeight: 1 }}>15–20</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-faint)', fontWeight: '500', marginTop: '4px' }}>minutes</p>
                </div>

                <button
                    onClick={() => setOrderStatus(null)}
                    style={{ padding: '14px 32px', background: 'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 100%)', border: '1px solid rgba(255,255,255,0.12)', borderTopColor: 'rgba(255,255,255,0.22)', color: 'var(--text-main)', borderRadius: '24px', fontSize: '1rem', fontWeight: '700', boxShadow: '0 4px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)' }}
                >
                    + Order More
                </button>
            </div>
        );
    }


    return (
        <>
        <div className="container animate-fade">
            <header style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', color: 'var(--text-main)', fontWeight: '800', letterSpacing: '-0.05em', lineHeight: 1 }}>snackssmania</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: '600', marginTop: '4px', letterSpacing: '0.02em' }}>
                            {isTakeaway ? '📦 Takeaway Order' : `🍽️ Table ${tableId}`}
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.15)' }}>
                        <span className="status-dot live" />
                        <span style={{ fontSize: '0.72rem', color: 'var(--accent-green)', fontWeight: '700', letterSpacing: '0.04em' }}>OPEN</span>
                    </div>
                </div>

                <input
                    type="text"
                    placeholder="🔍  Search menu…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '14px 18px',
                        fontSize: '0.95rem',
                        color: 'var(--text-main)',
                        marginBottom: '4px',
                    }}
                />
            </header>

            <div style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                paddingBottom: '20px',
                marginBottom: '8px',
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch'
            }}>
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`cat-pill ${activeCategory === cat.id ? 'active' : ''}`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 0', gap: '20px' }}>
                    <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        border: '3px solid rgba(255,255,255,0.08)',
                        borderTopColor: 'rgba(167,139,250,0.8)',
                        animation: 'spin 0.8s linear infinite',
                        boxShadow: '0 0 20px rgba(167,139,250,0.2)'
                    }} />
                    <p style={{ color: 'var(--text-faint)', fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Loading Menu</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', paddingBottom: '120px' }}>
                    {filteredItems.map((item, i) => (
                        <div key={item.id} style={{ animationDelay: `${i * 0.05}s` }}>
                            <MenuCard
                                item={item}
                                cartQuantity={cart[item.id]?.qty || 0}
                                onAdd={addToCart}
                                onRemove={removeFromCart}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>

            <CartBar
                count={cartCount}
                total={cartTotal}
                onPlaceOrder={() => setShowReview(true)}
                loading={orderStatus === 'submitting'}
            />

            {showReview && (
                <div className="animate-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    zIndex: 2000,
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center'
                }}>
                    <div className="animate-slide-up" style={{
                        width: '100%',
                        maxWidth: '480px',
                        backgroundColor: 'var(--bg-surface)',
                        borderTopLeftRadius: '32px',
                        borderTopRightRadius: '32px',
                        padding: '32px 24px',
                        maxHeight: '85vh',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 -24px 48px rgba(0,0,0,0.5), 0 -1px 0 var(--border-subtle)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>Review Order</h2>
                            <button onClick={() => setShowReview(false)} style={{ backgroundColor: 'var(--glass)', border: '1px solid var(--border-subtle)', width: '36px', height: '36px', borderRadius: '18px', fontSize: '1.2rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '24px', paddingRight: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {cartItemsArray.map(item => (
                                <div key={item.id} className="premium-border" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <p style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>{item.name}</p>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>₹{item.price * item.qty}</p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'var(--glass)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border-subtle)' }}>
                                        <button onClick={() => removeFromCart(item.id)} style={{ backgroundColor: 'transparent', color: 'var(--text-main)', fontSize: '1.2rem', padding: '4px 8px' }}>-</button>
                                        <span style={{ 
                                            fontSize: '0.9rem', 
                                            fontWeight: '700', 
                                            width: '24px', 
                                            height: '24px', 
                                            backgroundColor: 'var(--accent-white)', 
                                            color: 'var(--bg-dark)', 
                                            borderRadius: '6px', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center' 
                                        }}>
                                            {item.qty}
                                        </span>
                                        <button onClick={() => addToCart(item)} style={{ backgroundColor: 'transparent', color: 'var(--text-main)', fontSize: '1.2rem', padding: '4px 8px' }}>+</button>
                                    </div>
                                </div>
                            ))}
                            {cartItemsArray.length === 0 && (
                                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>Your cart is empty.</p>
                            )}
                        </div>

                        {cartItemsArray.length > 0 && (
                            <>
                                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '24px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: '500' }}>Total</span>
                                    <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>₹{cartTotal}</span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <button
                                        onClick={() => setShowReview(false)}
                                        style={{
                                            width: '100%',
                                            padding: '16px',
                                            backgroundColor: 'var(--glass)',
                                            border: '1px solid var(--border-subtle)',
                                            color: 'var(--text-main)',
                                            fontWeight: '600',
                                            borderRadius: '20px',
                                            fontSize: '1rem',
                                            cursor: 'pointer',
                                            letterSpacing: '-0.01em',
                                        }}
                                    >
                                        + Add More Items
                                    </button>

                                    <button
                                        onClick={() => {
                                            setShowReview(false);
                                            placeOrder();
                                        }}
                                        disabled={orderStatus === 'submitting'}
                                        style={{
                                            width: '100%',
                                            padding: '18px',
                                            backgroundColor: 'var(--accent-white)',
                                            color: 'var(--bg-dark)',
                                            fontWeight: '700',
                                            borderRadius: '20px',
                                            fontSize: '1.1rem',
                                            letterSpacing: '-0.01em',
                                            cursor: orderStatus === 'submitting' ? 'not-allowed' : 'pointer',
                                            opacity: orderStatus === 'submitting' ? 0.7 : 1,
                                        }}
                                    >
                                        {orderStatus === 'submitting' ? 'Placing Order...' : 'Confirm & Place Order'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default MenuPage;
