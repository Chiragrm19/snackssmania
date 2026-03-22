import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import OrderPopup from '../components/OrderPopup';
import InvoiceModal from '../components/InvoiceModal';
import { QRCodeSVG } from 'qrcode.react';

const AdminPage = () => {
    const [tables, setTables] = useState([]);
    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('floor'); // 'floor' | 'queue' | 'customize'
    const [newOrder, setNewOrder] = useState(null);
    const [notifiedOrderTotals, setNotifiedOrderTotals] = useState({});
    const [selectedTableOrder, setSelectedTableOrder] = useState(null);
    const [invoiceOrder, setInvoiceOrder] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [qrTable, setQrTable] = useState(null);
    const [qrBaseUrl, setQrBaseUrl] = useState(window.location.origin);
    const detectedIp = "10.18.40.43";

    const fetchMenuItems = async () => {
        const { data } = await supabase.from('menu_items').select('*');
        if (data) {
            setMenuItems(data);
        }
    };

    const fetchTables = async () => {
        const { data } = await supabase.from('tables').select('*').order('id');
        if (data) {
            setTables(data);
        }
    };

    const fetchOrders = async () => {
        const { data } = await supabase.from('orders')
            .select('*')
            .neq('status', 'paid')
            .order('id', { ascending: true });

        if (data) {
            setOrders(data);
        }
    };

    const fetchInitialData = async () => {
        setLoading(true);
        await Promise.all([fetchTables(), fetchOrders(), fetchMenuItems()]);
        setLoading(false);
    };

    useEffect(() => {
        fetchInitialData();

        const pollInterval = setInterval(() => {
            fetchTables();
            fetchOrders();
        }, 1500);

        const channel = supabase
            .channel('admin-ops')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                fetchOrders();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, () => {
                fetchTables();
            })
            .subscribe();

        return () => {
            clearInterval(pollInterval);
            supabase.removeChannel(channel);
        };
    }, []);

    useEffect(() => {
        if (!newOrder && orders.length > 0) {
            const unseen = orders.find(o => o.status === 'new' && notifiedOrderTotals[o.id] !== o.total);
            if (unseen) {
                setNewOrder(unseen);
                setNotifiedOrderTotals(prev => ({ ...prev, [unseen.id]: unseen.total }));
            }
        }
    }, [orders, newOrder, notifiedOrderTotals]);

    const acceptOrder = async (orderId, tableId) => {
        try {
            setTables(prev => prev.map(t => t.id === tableId ? { ...t, is_free: false } : t));
            const targetOrder = orders.find(o => o.id === orderId);
            if (!targetOrder) throw new Error('Order not found');

            const clearedItems = targetOrder.items.map(i => ({ ...i, isNew: false }));

            setTables(prev => prev.map(t => t.id === tableId ? { ...t, is_free: false } : t));
            
            if (selectedTableOrder && selectedTableOrder.id === orderId) {
                setSelectedTableOrder(prev => ({ ...prev, status: 'preparing', items: clearedItems }));
            }

            await supabase.from('tables').update({ is_free: false }).eq('id', tableId);

            const { data: updatedOrder, error: orderError } = await supabase
                .from('orders')
                .update({ 
                    status: 'preparing',
                    items: clearedItems
                })
                .eq('id', orderId)
                .select()
                .single();

            if (orderError) throw orderError;

            setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
            if (selectedTableOrder && selectedTableOrder.id === orderId) {
                setSelectedTableOrder(updatedOrder);
            }

            setNewOrder(null);
        } catch (err) {
            console.error('Error taking order:', err.message);
            alert('Failed to take order: ' + err.message);
            fetchInitialData();
        }
    };

    const markTableFree = async (tableId) => {
        try {
            const { error: tableError } = await supabase.from('tables').update({ is_free: true }).eq('id', tableId);
            if (tableError) throw tableError;

            const { error: orderError } = await supabase.from('orders')
                .update({ status: 'paid' })
                .eq('table_id', tableId)
                .neq('status', 'paid');

            if (orderError) throw orderError;

            setTables(prev => prev.map(t => t.id === tableId ? { ...t, is_free: true } : t));
            setOrders(prev => prev.filter(o => o.table_id !== tableId || o.status === 'paid'));

            setSelectedTableOrder(null);
            fetchInitialData();
        } catch (err) {
            console.error('Error clearing table:', err.message);
            alert('Failed to clear table: ' + err.message);
        }
    };

    const handleTableClick = (table) => {
        const tableOrder = orders.find(o => o.table_id === table.id && o.status !== 'paid');
        if (tableOrder) {
            setSelectedTableOrder(tableOrder);
        }
    };

    const getStats = () => {
        const occupiedTableIds = new Set(orders.filter(o => o.status !== 'paid').map(o => o.table_id));
        const occupied = occupiedTableIds.size;
        const free = tables.length - occupied;
        const activeOrders = orders.length;
        const revenue = orders.filter(o => o.status === 'paid').reduce((acc, curr) => acc + curr.total, 0);
        return { free, occupied, activeOrders, revenue };
    };

    const stats = getStats();

    return (
        <>
            <div className="admin-container animate-fade" style={{ minHeight: '100vh', paddingBottom: '40px' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', color: 'var(--text-main)', fontWeight: '700', letterSpacing: '-0.04em' }}>SNACKSMANIA ADMIN</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: '500' }}>Dashboard & Operations</p>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <button
                            onClick={() => setActiveTab('customize')}
                            style={{
                                padding: '12px 20px',
                                borderRadius: '16px',
                                backgroundColor: activeTab === 'customize' ? 'var(--accent-white)' : 'var(--glass)',
                                color: activeTab === 'customize' ? 'var(--bg-dark)' : 'var(--text-main)',
                                border: '1px solid var(--border-subtle)',
                                fontSize: '0.95rem',
                                fontWeight: '600',
                                letterSpacing: '-0.01em',
                                transition: 'all 0.3s'
                            }}
                        >
                            Customize
                        </button>
                        <div className="glass" style={{ padding: '12px 20px', borderRadius: '16px', fontWeight: '600', color: 'var(--text-main)' }}>
                            🔔 <span style={{ marginLeft: '8px' }}>{newOrder ? '1 New' : '0'}</span>
                        </div>
                        <button
                            onClick={() => supabase.auth.signOut()}
                            style={{
                                padding: '12px 20px',
                                borderRadius: '16px',
                                backgroundColor: 'var(--glass)',
                                color: 'var(--text-main)',
                                border: '1px solid var(--border-subtle)',
                                fontSize: '0.95rem',
                                fontWeight: '600',
                                letterSpacing: '-0.01em'
                            }}
                        >
                            Sign Out
                        </button>
                    </div>
                </header>

                {/* Stats Bar */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '24px',
                    marginBottom: '48px'
                }}>
                    {[
                        { label: 'Occupied', val: stats.occupied },
                        { label: 'Free', val: stats.free },
                        { label: 'Active Orders', val: stats.activeOrders },
                        { label: 'Revenue (Today)', val: `₹${stats.revenue}` }
                    ].map((s, i) => (
                        <div key={i} className="glass" style={{ padding: '24px', borderRadius: '24px' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>{s.label}</p>
                            <p style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--text-main)', letterSpacing: '-0.04em' }}>{s.val}</p>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', backgroundColor: 'var(--glass)', padding: '6px', borderRadius: '20px', width: 'fit-content' }}>
                    {['floor', 'queue'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '12px 32px',
                                backgroundColor: activeTab === tab ? 'var(--accent-white)' : 'transparent',
                                color: activeTab === tab ? 'var(--bg-dark)' : 'var(--text-muted)',
                                border: 'none',
                                borderRadius: '16px',
                                fontWeight: '600',
                                fontSize: '0.95rem',
                                letterSpacing: '-0.01em',
                                textTransform: 'capitalize',
                                transition: 'all 0.3s'
                            }}
                        >
                            {tab === 'floor' ? 'Floor View' : 'Orders Queue'}
                        </button>
                    ))}
                </div>

                {activeTab === 'customize' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                        {/* Menu Management */}
                        <div className="glass" style={{ padding: '32px', borderRadius: '24px' }}>
                            <h2 style={{ marginBottom: '24px', color: 'var(--text-main)', fontSize: '1.4rem', fontWeight: '600', letterSpacing: '-0.02em' }}>Menu Management</h2>

                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const formData = new FormData(e.target);
                                const newItem = {
                                    name: formData.get('name'),
                                    price: parseInt(formData.get('price')),
                                    category: formData.get('category'),
                                    description: formData.get('description'),
                                    emoji: formData.get('emoji') || '🍳',
                                    is_veg: formData.get('is_veg') === 'on',
                                    is_signature: formData.get('is_signature') === 'on',
                                    discount_pct: parseInt(formData.get('discount_pct')) || 0
                                };

                                const { error } = await supabase.from('menu_items').insert(newItem);
                                if (error) alert(error.message);
                                else {
                                    e.target.reset();
                                    fetchMenuItems();
                                }
                            }} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                                <input name="name" placeholder="Item Name" required className="glass" style={{ padding: '16px', borderRadius: '16px', color: 'var(--text-main)', outline: 'none' }} />
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <input name="price" type="number" placeholder="Price (₹)" required className="glass" style={{ flex: 1, padding: '16px', borderRadius: '16px', color: 'var(--text-main)', outline: 'none' }} />
                                    <select name="category" className="glass" style={{ flex: 1, padding: '16px', borderRadius: '16px', color: 'var(--text-main)', outline: 'none', appearance: 'none' }}>
                                        <option value="coffee" style={{color:'black'}}>Coffee</option>
                                        <option value="food" style={{color:'black'}}>Food</option>
                                        <option value="dessert" style={{color:'black'}}>Dessert</option>
                                        <option value="cold" style={{color:'black'}}>Cold</option>
                                    </select>
                                </div>
                                <textarea name="description" placeholder="Description" className="glass" style={{ padding: '16px', borderRadius: '16px', color: 'var(--text-main)', minHeight: '80px', outline: 'none' }} />
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <input name="emoji" placeholder="Emoji (e.g. 🍕)" className="glass" style={{ flex: 1, padding: '16px', borderRadius: '16px', color: 'var(--text-main)', outline: 'none' }} />
                                    <input name="discount_pct" type="number" placeholder="Discount %" className="glass" style={{ flex: 1, padding: '16px', borderRadius: '16px', color: 'var(--text-main)', outline: 'none' }} />
                                </div>
                                <div style={{ display: 'flex', gap: '24px', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input type="checkbox" name="is_veg" defaultChecked /> Veg
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input type="checkbox" name="is_signature" /> Signature
                                    </label>
                                </div>
                                <button type="submit" style={{ padding: '16px', backgroundColor: 'var(--accent-white)', color: 'var(--bg-dark)', fontWeight: '700', borderRadius: '16px', letterSpacing: '-0.01em', marginTop: '8px' }}>Add Menu Item</button>
                            </form>

                            <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '8px' }}>
                                {menuItems.map(item => (
                                    <div key={item.id} className="glass" style={{ padding: '16px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem' }}>
                                        <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>{item.emoji} {item.name} <span style={{ color: 'var(--text-muted)' }}>(₹{item.price})</span></span>
                                        <button
                                            onClick={async () => {
                                                if (confirm(`Delete ${item.name}?`)) {
                                                    await supabase.from('menu_items').delete().eq('id', item.id);
                                                    fetchMenuItems();
                                                }
                                            }}
                                            style={{ backgroundColor: 'transparent', color: 'var(--text-faint)', border: 'none', padding: '8px', borderRadius: '8px' }}
                                        >✕</button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Table Management */}
                        <div className="glass" style={{ padding: '32px', borderRadius: '24px' }}>
                            <h2 style={{ marginBottom: '24px', color: 'var(--text-main)', fontSize: '1.4rem', fontWeight: '600', letterSpacing: '-0.02em' }}>Table Management</h2>

                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const formData = new FormData(e.target);
                                const newTable = {
                                    id: parseInt(formData.get('id')),
                                    seats: parseInt(formData.get('seats')),
                                    is_free: true
                                };

                                const { error } = await supabase.from('tables').insert(newTable);
                                if (error) alert(error.message);
                                else {
                                    e.target.reset();
                                    fetchTables();
                                }
                            }} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <input name="id" type="number" placeholder="Table No." required className="glass" style={{ flex: 1, padding: '16px', borderRadius: '16px', color: 'var(--text-main)', outline: 'none' }} />
                                    <input name="seats" type="number" placeholder="Seats" required className="glass" style={{ flex: 1, padding: '16px', borderRadius: '16px', color: 'var(--text-main)', outline: 'none' }} />
                                </div>
                                <button type="submit" style={{ padding: '16px', backgroundColor: 'var(--accent-white)', color: 'var(--bg-dark)', fontWeight: '700', borderRadius: '16px', letterSpacing: '-0.01em' }}>Add Table</button>
                            </form>

                            <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '8px' }}>
                                {tables.map(table => (
                                    <div key={table.id} className="glass" style={{ padding: '16px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem' }}>
                                        <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>Table {table.id} <span style={{ color: 'var(--text-muted)' }}>({table.seats} Seats)</span></span>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <button
                                                onClick={() => setQrTable(table)}
                                                style={{ backgroundColor: 'var(--glass)', border: '1px solid var(--border-subtle)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-main)' }}
                                            >QR</button>
                                            <button
                                                onClick={async () => {
                                                    if (confirm(`Delete Table ${table.id}?`)) {
                                                        await supabase.from('tables').delete().eq('id', table.id);
                                                        fetchTables();
                                                    }
                                                }}
                                                style={{ backgroundColor: 'transparent', color: 'var(--text-faint)', border: 'none', padding: '6px', borderRadius: '8px' }}
                                            >✕</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'floor' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                        {tables.map(table => {
                            const tableOrder = orders.find(o => o.table_id === table.id && o.status !== 'paid');
                            const isOccupied = (tableOrder && tableOrder.status !== 'new') || !table.is_free;
                            const hasNewOrder = tableOrder?.status === 'new';

                            return (
                                <div
                                    key={table.id}
                                    onClick={() => handleTableClick(table)}
                                    className="glass"
                                    style={{
                                        padding: '32px 24px',
                                        borderRadius: '24px',
                                        border: isOccupied ? '1px solid var(--text-main)' : (hasNewOrder ? '1px solid var(--text-muted)' : '1px solid var(--border-subtle)'),
                                        backgroundColor: isOccupied ? 'var(--accent-white)' : (hasNewOrder ? 'var(--glass-hover)' : 'var(--glass)'),
                                        color: isOccupied ? 'var(--bg-dark)' : 'var(--text-main)',
                                        cursor: (isOccupied || hasNewOrder) ? 'pointer' : 'default',
                                        position: 'relative',
                                        textAlign: 'center',
                                        transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)'
                                    }}
                                >
                                    <div style={{
                                        position: 'absolute',
                                        top: '16px',
                                        right: '16px',
                                        padding: '4px 10px',
                                        borderRadius: '16px',
                                        fontSize: '0.7rem',
                                        fontWeight: '700',
                                        letterSpacing: '0.05em',
                                        backgroundColor: isOccupied ? 'var(--bg-dark)' : (hasNewOrder ? 'var(--text-main)' : 'var(--glass)'),
                                        color: isOccupied ? 'var(--accent-white)' : (hasNewOrder ? 'var(--bg-dark)' : 'var(--text-muted)')
                                    }}>
                                        {isOccupied ? 'OCCUPIED' : (hasNewOrder ? 'NEW ⚡' : 'FREE')}
                                    </div>

                                    <h3 style={{ fontSize: '1.6rem', marginBottom: '8px', fontWeight: '700', letterSpacing: '-0.02em', color: isOccupied ? 'var(--bg-dark)' : 'var(--text-main)' }}>Table {table.id}</h3>
                                    <p style={{ color: isOccupied ? 'rgba(0,0,0,0.6)' : 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>{table.seats} Seats</p>

                                    {(isOccupied || hasNewOrder) && (
                                        <div style={{ marginTop: '24px', color: isOccupied ? 'var(--bg-dark)' : 'var(--text-main)', fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.05em' }}>
                                            VIEW ORDER →
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {orders.map(order => (
                            <div key={order.id} className="glass" style={{ padding: '24px', borderRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                                        <span style={{ fontSize: '1.4rem', fontWeight: '700', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>Table {order.table_id}</span>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '16px',
                                            fontSize: '0.75rem',
                                            fontWeight: '700',
                                            letterSpacing: '0.05em',
                                            backgroundColor: order.status === 'new' ? 'var(--text-main)' : 'var(--glass-hover)',
                                            color: order.status === 'new' ? 'var(--bg-dark)' : 'var(--text-main)',
                                            border: order.status === 'new' ? 'none' : '1px solid var(--border-subtle)'
                                        }}>
                                            {order.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: '500' }}>
                                        {order.items.map(i => `${i.qty}x ${i.name}`).join(', ')}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                    <p style={{ fontSize: '1.6rem', fontWeight: '700', marginBottom: '4px', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>₹{order.total}</p>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
                                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setInvoiceOrder(order); }}
                                        style={{ padding: '8px 20px', fontSize: '0.9rem', backgroundColor: 'var(--glass)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', borderRadius: '16px', fontWeight: '600' }}
                                    >
                                        Invoice Details
                                    </button>
                                </div>
                            </div>
                        ))}
                        {orders.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '120px 0', color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: '500', letterSpacing: '-0.01em' }}>
                                No active orders in queue
                            </div>
                        )}
                    </div>
                )}

                {/* Order Detail Modal */}
                {selectedTableOrder && (
                    <div className="animate-overlay" style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        zIndex: 2000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '24px'
                    }}>
                        <div className="glass animate-fade" style={{ width: '100%', maxWidth: '560px', borderRadius: '24px', padding: '32px', backgroundColor: 'var(--bg-surface)', boxShadow: '0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px var(--border-subtle)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>Table {selectedTableOrder.table_id} Order</h2>
                                <button onClick={() => setSelectedTableOrder(null)} style={{ backgroundColor: 'var(--glass)', border: '1px solid var(--border-subtle)', width: '36px', height: '36px', borderRadius: '18px', fontSize: '1.2rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>✕</button>
                            </div>

                            <div style={{ marginBottom: '32px' }}>
                                {selectedTableOrder.items.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '1.1rem', color: 'var(--text-main)' }}>
                                        <span style={{ fontWeight: '500' }}><span style={{ color: 'var(--text-muted)', marginRight: '12px' }}>{item.qty}x</span> {item.name}</span>
                                        <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>₹{item.price * item.qty}</span>
                                    </div>
                                ))}
                                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px', marginTop: '20px', display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '1.6rem', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: '500', alignSelf: 'center' }}>Total</span>
                                    <span>₹{selectedTableOrder.total}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '16px' }}>
                                {selectedTableOrder.status === 'new' && (
                                    <button
                                        onClick={() => acceptOrder(selectedTableOrder.id, selectedTableOrder.table_id)}
                                        style={{ flex: 1, padding: '16px', backgroundColor: 'var(--text-main)', color: 'var(--bg-dark)', fontWeight: '700', borderRadius: '16px', cursor: 'pointer' }}
                                    >
                                        Take Order
                                    </button>
                                )}
                                <button
                                    onClick={() => markTableFree(selectedTableOrder.table_id)}
                                    style={{ flex: 1, padding: '16px', backgroundColor: 'var(--glass)', border: '1px solid var(--text-faint)', color: 'var(--text-main)', fontWeight: '600', borderRadius: '16px', cursor: 'pointer' }}
                                >
                                    Clear Table
                                </button>
                                <button
                                    onClick={() => setInvoiceOrder(selectedTableOrder)}
                                    style={{ flex: 1, padding: '16px', backgroundColor: 'var(--accent-white)', color: 'var(--bg-dark)', fontWeight: '700', borderRadius: '16px', cursor: 'pointer' }}
                                >
                                    Invoice
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* QR Modal */}
                {qrTable && (
                    <div className="animate-overlay" style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '24px'
                    }}>
                        <div className="glass animate-fade" style={{
                            width: '100%',
                            maxWidth: '400px',
                            borderRadius: '32px',
                            padding: '40px',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '32px',
                            backgroundColor: 'var(--bg-surface)',
                            boxShadow: '0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px var(--border-subtle)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '1.6rem', fontWeight: '600', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>Table {qrTable.id} QR</h2>
                                <button onClick={() => setQrTable(null)} style={{ backgroundColor: 'var(--glass)', border: '1px solid var(--border-subtle)', width: '36px', height: '36px', borderRadius: '18px', fontSize: '1.2rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>✕</button>
                            </div>

                            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '24px', lineHeight: 0, boxShadow: '0 8px 32px rgba(255,255,255,0.1)' }}>
                                <QRCodeSVG
                                    value={`${qrBaseUrl.replace(/\/$/, '')}/menu?table=${qrTable.id}`}
                                    size={220}
                                    bgColor="#ffffff"
                                    fgColor="#000000"
                                    level="H"
                                />
                            </div>

                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
                                <div className="glass" style={{ padding: '16px', borderRadius: '16px', fontSize: '0.85rem' }}>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>
                                        <b>Pro Tip:</b> Use your IP <code>{detectedIp}</code> for mobile scanning.
                                    </p>
                                    <input 
                                        type="text"
                                        value={qrBaseUrl}
                                        onChange={(e) => setQrBaseUrl(e.target.value)}
                                        placeholder={`http://${detectedIp}:5175`}
                                        style={{ width: '100%', padding: '10px 14px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.85rem' }}
                                    />
                                </div>

                                <div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px', fontWeight: '500' }}>Menu Link</p>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input
                                            readOnly
                                            value={`${qrBaseUrl.replace(/\/$/, '')}/menu?table=${qrTable.id}`}
                                            className="glass"
                                            style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', fontSize: '0.9rem', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', outline: 'none' }}
                                        />
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(`${qrBaseUrl.replace(/\/$/, '')}/menu?table=${qrTable.id}`);
                                                alert('Link copied!');
                                            }}
                                            style={{ padding: '12px 20px', backgroundColor: 'var(--glass)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', fontSize: '0.9rem', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }}
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => window.print()}
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    backgroundColor: 'var(--accent-white)',
                                    color: 'var(--bg-dark)',
                                    fontWeight: '700',
                                    borderRadius: '16px',
                                    letterSpacing: '-0.01em',
                                    fontSize: '1rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Print QR Code
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Real-time Order Popup */}
            {newOrder && (
                <OrderPopup
                    order={newOrder}
                    onAccept={acceptOrder}
                    onDismiss={() => setNewOrder(null)}
                />
            )}

            {/* Invoice Modal */}
            <InvoiceModal
                order={invoiceOrder}
                isOpen={!!invoiceOrder}
                onClose={() => setInvoiceOrder(null)}
            />
            {/* QR Modal */}
            {qrTable && (
                <div className="animate-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px'
                }}>
                    <div className="glass animate-fade" style={{
                        width: '100%',
                        maxWidth: '400px',
                        borderRadius: '32px',
                        padding: '40px',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '32px',
                        backgroundColor: 'var(--bg-surface)',
                        boxShadow: '0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px var(--border-subtle)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.6rem', fontWeight: '600', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>Table {qrTable.id} QR</h2>
                            <button onClick={() => setQrTable(null)} style={{ backgroundColor: 'var(--glass)', border: '1px solid var(--border-subtle)', width: '36px', height: '36px', borderRadius: '18px', fontSize: '1.2rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>✕</button>
                        </div>

                        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '24px', lineHeight: 0, boxShadow: '0 8px 32px rgba(255,255,255,0.1)' }}>
                            <QRCodeSVG
                                value={`${window.location.origin}/menu?table=${qrTable.id}`}
                                size={220}
                                bgColor="#ffffff"
                                fgColor="#000000"
                                level="H"
                            />
                        </div>

                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'left', marginBottom: '4px', fontWeight: '500' }}>Menu URL</p>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    readOnly
                                    value={`${window.location.origin}/menu?table=${qrTable.id}`}
                                    className="glass"
                                    style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', fontSize: '0.9rem', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', outline: 'none' }}
                                />
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}/menu?table=${qrTable.id}`);
                                        alert('Link copied!');
                                    }}
                                    style={{ padding: '12px 20px', backgroundColor: 'var(--glass)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', fontSize: '0.9rem', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }}
                                >
                                    Copy
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={() => window.print()}
                            style={{
                                width: '100%',
                                padding: '16px',
                                backgroundColor: 'var(--accent-white)',
                                color: 'var(--bg-dark)',
                                fontWeight: '700',
                                borderRadius: '16px',
                                letterSpacing: '-0.01em',
                                fontSize: '1rem',
                                cursor: 'pointer'
                            }}
                        >
                            Print QR Code
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminPage;
