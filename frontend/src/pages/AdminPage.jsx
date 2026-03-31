import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import OrderPopup from '../components/OrderPopup';
import InvoiceModal from '../components/InvoiceModal';
import InventoryManager from '../components/InventoryManager';
import BulkQRModal from '../components/BulkQRModal';
import { QRCodeSVG } from 'qrcode.react';

const AdminPage = () => {
    const [tables, setTables] = useState([]);
    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('floor'); // 'floor' | 'queue' | 'takeaway' | 'customize'
    const [newOrder, setNewOrder] = useState(null);
    const [notifiedOrderTotals, setNotifiedOrderTotals] = useState({});
    const [selectedTableOrder, setSelectedTableOrder] = useState(null);
    const [invoiceOrder, setInvoiceOrder] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [qrTable, setQrTable] = useState(null);
    const [qrBaseUrl, setQrBaseUrl] = useState(window.location.host);
    const [mappingItem, setMappingItem] = useState(null);
    const [showBulkQR, setShowBulkQR] = useState(false);
    const [categories, setCategories] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [showManualOrder, setShowManualOrder] = useState(null); // tableId
    const [editItem, setEditItem] = useState(null);
    const [editCategory, setEditCategory] = useState(null);
    const [menuSearch, setMenuSearch] = useState('');
    const [manualCart, setManualCart] = useState([]);
    const [manualSearch, setManualSearch] = useState('');
    const [manualCategory, setManualCategory] = useState('all');
    const [isAddingItem, setIsAddingItem] = useState(false);
    const [addItemSearch, setAddItemSearch] = useState('');
    const [isAddNewAsParcel, setIsAddNewAsParcel] = useState(false);
    const [customerContacts, setCustomerContacts] = useState([]);
    const [customerSearch, setCustomerSearch] = useState('');
    const [payPhone, setPayPhone] = useState('');
    const [payName, setPayName] = useState('');
    const [payExists, setPayExists] = useState(false);
    
    // Security Utility: Sanitize inputs to prevent XSS
    const sanitize = (str) => {
        if (typeof str !== 'string') return str;
        return str.replace(/[<>]/g, '').trim();
    };
    
    // Recipe Modal State
    const [newMatId, setNewMatId] = useState('');
    const [newMatQty, setNewMatQty] = useState('');
    
    const detectedIp = "10.18.40.43";

    // --- Inventory State (Lifted) ---
    const [materials, setMaterials] = useState(() => {
        const saved = localStorage.getItem('inv_materials');
        return saved ? JSON.parse(saved) : [];
    });
    const [invRecipes, setInvRecipes] = useState(() => {
        const saved = localStorage.getItem('inv_recipes');
        return saved ? JSON.parse(saved) : [];
    });
    const [consumeLog, setConsumeLog] = useState(() => {
        const saved = localStorage.getItem('inv_consume_log');
        return saved ? JSON.parse(saved) : [];
    });
    const [restockLog, setRestockLog] = useState(() => {
        const saved = localStorage.getItem('inv_restock_log');
        return saved ? JSON.parse(saved) : [];
    });
    const [deductedOrders, setDeductedOrders] = useState(() => {
        const saved = localStorage.getItem('inv_deducted_orders');
        return saved ? JSON.parse(saved) : [];
    });

    // --- Persistence Sync ---
    useEffect(() => {
        localStorage.setItem('inv_materials', JSON.stringify(materials));
        localStorage.setItem('inv_recipes', JSON.stringify(invRecipes));
        localStorage.setItem('inv_consume_log', JSON.stringify(consumeLog));
        localStorage.setItem('inv_restock_log', JSON.stringify(restockLog));
        localStorage.setItem('inv_deducted_orders', JSON.stringify(deductedOrders));
    }, [materials, invRecipes, consumeLog, restockLog, deductedOrders]);

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

    const fetchCategories = async () => {
        const { data } = await supabase.from('categories').select('*').order('name');
        if (data) {
            setCategories(data);
        }
    };

    const fetchCustomers = async () => {
        const { data } = await supabase.from('customers').select('*').order('name');
        if (data) {
            setCustomerContacts(data);
        }
    };

    const checkCustomerByPhone = async (phone) => {
        if (phone.length === 10) {
            const { data } = await supabase.from('customers').select('*').eq('phone_number', phone).single();
            if (data) {
                setPayName(data.name);
                setPayExists(true);
            } else {
                setPayExists(false);
            }
        } else {
            setPayExists(false);
        }
    };

    const fetchOrders = async () => {
        const { data } = await supabase.from('orders')
            .select('*')
            .order('id', { ascending: true }); // Fetching all (active + paid) for stats

        if (data) {
            setOrders(data);
        }
    };

    const fetchInitialData = async () => {
        setLoading(true);
        await Promise.all([fetchTables(), fetchOrders(), fetchMenuItems(), fetchCategories(), fetchCustomers()]);

        try {
            // Always check against a fresh snapshot from DB to avoid duplicate inserts
            const { data: currentMenu, error: menuError } = await supabase
                .from('menu_items')
                .select('name');

            if (!menuError && currentMenu) {
                const existingNames = new Set(
                    currentMenu.map(m => (m.name || '').toLowerCase())
                );

                const requiredDrinks = [
                    { name: 'Water Bottle', price: 20, category: 'cold', emoji: '💧', description: 'Chilled mineral water', is_veg: true },
                    { name: 'Sprite', price: 40, category: 'cold', emoji: '🥤', description: 'Lemon-lime soda', is_veg: true },
                    { name: 'Thumbs Up', price: 40, category: 'cold', emoji: '🥤', description: 'Strong cola', is_veg: true },
                ];

                const drinksToInsert = requiredDrinks.filter(
                    drink => !existingNames.has(drink.name.toLowerCase())
                );

                if (drinksToInsert.length > 0) {
                    await supabase.from('menu_items').insert(drinksToInsert);
                }
            }
        } catch (e) {
            console.error('Error ensuring default drinks:', e);
        }

        await fetchMenuItems(); // Refresh after any seeding
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
            .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
                fetchCustomers();
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

    // --- Automated Stock Deduction ---
    useEffect(() => {
        const ordersToDeduct = orders.filter(o => 
            (o.status === 'preparing' || o.status === 'ready' || o.status === 'paid') && 
            !deductedOrders.includes(o.id)
        );

        if (ordersToDeduct.length > 0) {
            let updatedMaterials = [...materials];
            let newLogs = [];
            let newDeductedIds = [...deductedOrders];

            ordersToDeduct.forEach(order => {
                order.items.forEach(item => {
                    // Normalize item name for matching
                    const recipe = invRecipes.find(r => r.menuItemId === item.id || r.name === item.name);
                    if (recipe) {
                        const qty = item.quantity || 1;
                        recipe.recipe.forEach(ing => {
                            const matIdx = updatedMaterials.findIndex(m => m.id === ing.materialId);
                            if (matIdx !== -1) {
                                updatedMaterials[matIdx] = {
                                    ...updatedMaterials[matIdx],
                                    stock: updatedMaterials[matIdx].stock - (ing.qty * qty)
                                };
                            }
                        });
                        newLogs.push({
                            id: Math.random().toString(36).substr(2, 9),
                            time: Date.now(),
                            recipeName: order.table_id === 0 ? `TK-${order.id} (${item.name})` : `Table ${order.table_id} (${item.name})`,
                            qty: qty,
                            deducted: recipe.recipe.map(ing => {
                                const m = materials.find(mat => mat.id === ing.materialId);
                                return { name: m?.name || 'Unknown', unit: m?.unit || '', qty: ing.qty * qty };
                            })
                        });
                    }
                });
                newDeductedIds.push(order.id);
            });

            if (newLogs.length > 0) {
                setMaterials(updatedMaterials);
                setConsumeLog(prev => [...newLogs, ...prev]);
                setDeductedOrders(newDeductedIds);
            } else {
                // Mark as processed even if no recipe matches
                setDeductedOrders(newDeductedIds);
            }
        }
    }, [orders, materials, invRecipes, deductedOrders]);

    const handleImageUpload = async (file) => {
        if (!file) return null;
        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('menu-images')
                .upload(filePath, file);

            if (uploadError) {
                if (uploadError.message === 'Bucket not found') {
                    throw new Error('Storage bucket "menu-images" not found. Please create it in your Supabase dashboard.');
                }
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('menu-images')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error('Upload error details:', error);
            alert('Upload failed: ' + error.message);
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    const placeManualOrder = async (tableId, items) => {
        try {
            let orderToUpdate = null;
            
            // Only merge for actual tables (not takeaway ID 0)
            if (tableId > 0) {
                const { data } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('table_id', tableId)
                    .neq('status', 'paid');
                
                if (data && data.length > 0) {
                    orderToUpdate = data[0]; // Take the first active order for this table
                }
            }

            if (orderToUpdate) {
                // Merge with existing
                const updatedItems = [...orderToUpdate.items];
                items.forEach(newItem => {
                    // Match by ID AND the isParcel flag
                    const idx = updatedItems.findIndex(i => i.id === newItem.id && !!i.isParcel === !!newItem.isParcel);
                    if (idx > -1) updatedItems[idx].qty += newItem.qty;
                    else updatedItems.push({ ...newItem, isNew: false, qty: newItem.qty });
                });
                const newTotal = orderToUpdate.total + items.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
                
                await supabase.from('orders').update({
                    items: updatedItems,
                    total: newTotal,
                    status: 'preparing'
                }).eq('id', orderToUpdate.id);
            } else {
                // New Order (New takeaway or new table)
                const total = items.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
                const orderData = {
                    table_id: tableId,
                    items: items.map(i => ({ ...i, isNew: false })),
                    total,
                    status: 'preparing'
                };

                // Add takeaway metadata if Table 0
                if (tableId === 0) {
                    const takeawayNo = Math.floor(Math.random() * 9000) + 1000;
                    orderData.items.push({ type: 'METADATA', takeaway_no: takeawayNo });
                }

                await supabase.from('orders').insert(orderData);
            }
            
            if (tableId > 0) {
                await supabase.from('tables').update({ is_free: false }).eq('id', tableId);
            }
            
            fetchInitialData();
            setShowManualOrder(null);
            setManualCart([]);
            alert('Order placed successfully!');
        } catch (err) {
            console.error('Manual order error:', err);
            alert('Failed to place manual order: ' + err.message);
        }
    };

    const clearAllData = async () => {
        const confirmClear = confirm("Are you sure you want to CLEAR ALL ORDERS and RESET TABLES for a new day?");
        if (!confirmClear) return;

        const saveBackup = confirm("Would you like to SAVE A BACKUP of today's orders to your computer first?");
        if (saveBackup) {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(orders, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `cafe_backup_${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        }

        try {
            // Clear orders - use .gt('id', 0) for numeric IDs
            const { error: orderError } = await supabase.from('orders').delete().gt('id', 0);
            if (orderError) throw orderError;

            // Reset Tables - use .gt('id', -1) for numeric IDs
            const { error: tableError } = await supabase.from('tables').update({ is_free: true }).gt('id', -1);
            if (tableError) throw tableError;

            alert("Data cleared successfully! Ready for a new day.");
            fetchInitialData();
        } catch (err) {
            alert("Error clearing data: " + err.message);
        }
    };

    const rejectOrder = async (orderId) => {
        try {
            const targetOrder = orders.find(o => o.id === orderId);

            const { error: orderError } = await supabase
                .from('orders')
                .update({ status: 'rejected' })
                .eq('id', orderId);

            if (orderError) throw orderError;

            // If this was a dine-in table, immediately free it up
            if (targetOrder && targetOrder.table_id > 0) {
                await supabase
                    .from('tables')
                    .update({ is_free: true })
                    .eq('id', targetOrder.table_id);

                setTables(prev =>
                    prev.map(t =>
                        t.id === targetOrder.table_id ? { ...t, is_free: true } : t
                    )
                );

                if (selectedTableOrder && selectedTableOrder.id === orderId) {
                    setSelectedTableOrder(prev =>
                        prev ? { ...prev, status: 'rejected' } : prev
                    );
                }
            }

            setNewOrder(null);
            fetchOrders();
        } catch (err) {
            console.error('Error rejecting order:', err.message);
            alert('Failed to dismiss order: ' + err.message);
        }
    };

    const acceptOrder = async (orderId, tableId) => {
        try {
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

    const handleUpdateItemQty = async (orderId, itemName, delta, isParcelFlag = null) => {
        try {
            const order = orders.find(o => o.id === orderId);
            if (!order) return;

            let newItems = [...order.items];
            const itemIdx = newItems.findIndex(
                i =>
                    i.name === itemName &&
                    !!i.isParcel === !!isParcelFlag &&
                    i.type !== 'METADATA'
            );
            
            if (itemIdx === -1) return;

            const updatedQty = newItems[itemIdx].qty + delta;
            
            if (updatedQty <= 0) {
                // Remove item
                newItems.splice(itemIdx, 1);
            } else {
                // Update qty
                newItems[itemIdx] = { ...newItems[itemIdx], qty: updatedQty };
            }

            // Recalculate total (excluding metadata)
            const newTotal = newItems
                .filter(i => i.type !== 'METADATA' && i.type !== 'PAYMENT_METADATA')
                .reduce((acc, curr) => acc + (curr.price * curr.qty), 0);

            const { data: updatedOrder, error } = await supabase
                .from('orders')
                .update({ items: newItems, total: newTotal })
                .eq('id', orderId)
                .select()
                .single();

            if (error) throw error;

            setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
            if (selectedTableOrder && selectedTableOrder.id === orderId) {
                setSelectedTableOrder(updatedOrder);
            }
        } catch (err) {
            console.error('Error updating quantity:', err.message);
        }
    };

    const markTableFree = async (tableId, paymentMethod = null) => {
        try {
            // Save/Update Customer Info if provided
            if (payPhone && payName) {
                const { error: custError } = await supabase
                    .from('customers')
                    .upsert({ 
                        name: payName, 
                        phone_number: payPhone 
                    }, { onConflict: 'phone_number' });
                
                if (custError) console.error('Error saving customer during payment:', custError);
                
                // Clear state
                setPayPhone('');
                setPayName('');
                setPayExists(false);
            }

            const { error: tableError } = await supabase.from('tables').update({ is_free: true }).eq('id', tableId);
            if (tableError) throw tableError;

            const updates = { status: 'paid' };
            if (paymentMethod) updates.payment_method = paymentMethod;

            const { error: orderError } = await supabase.from('orders')
                .update(updates)
                .eq('table_id', tableId)
                .neq('status', 'paid');

            if (orderError) {
                // If column is missing, use the items array as a fallback
                if (orderError.message.includes('payment_method')) {
                    const { data: orderToFix } = await supabase.from('orders').select('items').eq('table_id', tableId).neq('status', 'paid').maybeSingle();
                    if (orderToFix) {
                        const fixedItems = [...orderToFix.items, { type: 'PAYMENT_METADATA', method: paymentMethod || 'Cash' }];
                        await supabase.from('orders').update({ 
                            status: 'paid', 
                            items: fixedItems 
                        }).eq('table_id', tableId).neq('status', 'paid');
                    }
                } else {
                    throw orderError;
                }
            }

            setTables(prev => prev.map(t => t.id === tableId ? { ...t, is_free: true } : t));
            setOrders(prev => prev.filter(o => o.table_id !== tableId || o.status === 'paid'));

            setSelectedTableOrder(null);
            fetchInitialData();
        } catch (err) {
            console.error('Error clearing table:', err.message);
            alert('Failed to clear table: ' + err.message);
        }
    };

    const completeTakeaway = async (orderId) => {
        try {
            const { error } = await supabase.from('orders')
                .update({ status: 'paid' })
                .eq('id', orderId);
            
            if (error) throw error;
            setOrders(prev => prev.filter(o => o.id !== orderId));
            alert('Parcel Handed Over Successfully!');
        } catch (err) {
            console.error('Error completing takeaway:', err.message);
            alert('Failed to complete takeaway: ' + err.message);
        }
    };

    const handleOrderPaid = async (orderId, method) => {
        try {
            const order = orders.find(o => o.id === orderId);
            if (!order) return;

            const existingMeta = order.items.find(i => i.type === 'PAYMENT_METADATA');
            let newItems = [...order.items];
            
            if (existingMeta) {
                newItems = newItems.map(i => i.type === 'PAYMENT_METADATA' ? { ...i, method } : i);
            } else {
                newItems.push({ type: 'PAYMENT_METADATA', method });
            }

            const { error } = await supabase.from('orders')
                .update({ items: newItems, status: 'paid' })
                .eq('id', orderId);

            if (error) throw error;
            fetchOrders();
            setInvoiceOrder(null);
        } catch (err) {
            console.error('Error recording payment:', err.message);
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

        // Revenue Breakdown
        const paidOrders = orders.filter(o => o.status === 'paid');
        const revenue = paidOrders.reduce((acc, curr) => acc + curr.total, 0);
        
        const cashRevenue = paidOrders.reduce((acc, curr) => {
            const payMeta = curr.items.find(i => i.type === 'PAYMENT_METADATA');
            const method = curr.payment_method || payMeta?.method || 'Cash';
            return acc + (method === 'Cash' ? curr.total : 0);
        }, 0);

        const onlineRevenue = paidOrders.reduce((acc, curr) => {
            const payMeta = curr.items.find(i => i.type === 'PAYMENT_METADATA');
            const method = curr.payment_method || payMeta?.method;
            return acc + (method === 'Online' ? curr.total : 0);
        }, 0);

        return { free, occupied, activeOrders, revenue, cashRevenue, onlineRevenue };
    };

    const stats = getStats();

    return (
        <>
            <div className="admin-container animate-fade" style={{ minHeight: '100vh', paddingBottom: '40px' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', gap: '16px', flexWrap: 'wrap' }}>
                    <div>
                        <h1 style={{ fontSize: 'clamp(1.4rem, 5vw, 2.2rem)', color: 'var(--text-main)', fontWeight: '800', letterSpacing: '-0.04em', lineHeight: 1.1 }}>snackssmania ADMIN</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: '500', marginTop: '4px' }}>Dashboard & Operations</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => setActiveTab('customize')}
                            style={{
                                padding: '10px 16px',
                                borderRadius: '14px',
                                backgroundColor: activeTab === 'customize' ? 'var(--accent-white)' : 'var(--glass)',
                                color: activeTab === 'customize' ? 'var(--bg-dark)' : 'var(--text-main)',
                                border: '1px solid var(--border-subtle)',
                                fontSize: '0.85rem',
                                fontWeight: '700',
                                transition: 'all 0.3s'
                            }}
                        >
                            ⚙️ Customize
                        </button>
                        <button
                            onClick={clearAllData}
                            style={{
                                padding: '10px 16px',
                                borderRadius: '14px',
                                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                color: '#f87171',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                fontSize: '0.85rem',
                                fontWeight: '700',
                                transition: 'all 0.3s'
                            }}
                        >
                            🧹 Clear Data
                        </button>
                        <div className="glass" style={{ padding: '10px 16px', borderRadius: '14px', fontWeight: '600', color: 'var(--text-main)', fontSize: '0.85rem' }}>
                            🔔 <span style={{ marginLeft: '6px' }}>{newOrder ? '1 New' : '0'}</span>
                        </div>
                        <button
                            onClick={() => supabase.auth.signOut()}
                            style={{
                                padding: '10px 16px',
                                borderRadius: '14px',
                                backgroundColor: 'var(--glass)',
                                color: 'var(--text-main)',
                                border: '1px solid var(--border-subtle)',
                                fontSize: '0.85rem',
                                fontWeight: '700',
                            }}
                        >
                            Sign Out
                        </button>
                    </div>
                </header>

                {/* Stats Bar */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '12px',
                    marginBottom: '28px'
                }}>
                    {[
                        { label: 'Occupied',  val: stats.occupied,      icon: '🪑', c: 'var(--text-main)' },
                        { label: 'Free',       val: stats.free,          icon: '✅', c: 'var(--accent-green)' },
                        { label: 'Orders',     val: stats.activeOrders,  icon: '📋', c: 'var(--accent-purple)' },
                        { label: 'Total Rev',  val: `₹${stats.revenue}`, icon: '💰', c: 'var(--text-main)' },
                        { label: 'Cash',       val: `₹${stats.cashRevenue}`, icon: '💵', c: '#fbbf24' },
                        { label: 'Online',     val: `₹${stats.onlineRevenue}`, icon: '💳', c: '#60a5fa' }
                    ].map((s, i) => (
                        <div key={i} className="glass" style={{ padding: '16px 12px', borderRadius: '18px', textAlign: 'center' }}>
                            <p style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{s.icon}</p>
                            <p style={{ fontSize: 'clamp(1.1rem, 3.5vw, 1.8rem)', fontWeight: '900', color: s.c, letterSpacing: '-0.04em' }}>{s.val}</p>
                            <p style={{ color: 'var(--text-faint)', fontSize: '0.65rem', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '800' }}>{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', background: 'var(--glass)', padding: '5px', borderRadius: '18px', overflowX: 'auto', flexWrap: 'nowrap' }}>
                    {[
                        { id: 'floor',     label: '🪑 Floor' },
                        { id: 'queue',     label: '📋 Queue' },
                        { id: 'takeaway',  label: '📦 Parcel' },
                        { id: 'inventory', label: '🏷️ Inventory' },
                        { id: 'categories', label: '📂 Categories' },
                        { id: 'customers', label: '👥 Customers' },
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            style={{
                                padding: '10px 18px',
                                backgroundColor: activeTab === t.id ? 'var(--accent-white)' : 'transparent',
                                color: activeTab === t.id ? 'var(--bg-dark)' : 'var(--text-muted)',
                                border: 'none',
                                borderRadius: '14px',
                                fontWeight: '700',
                                fontSize: '0.85rem',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.3s',
                                cursor: 'pointer',
                                flexShrink: 0,
                            }}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'customize' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                        {/* Menu Management */}
                        <div className="glass" style={{ padding: '32px', borderRadius: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h2 style={{ color: 'var(--text-main)', fontSize: '1.4rem', fontWeight: '600', letterSpacing: '-0.02em' }}>Menu Management</h2>
                            </div>

                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const formData = new FormData(e.target);
                                const imageFile = formData.get('image');
                                let image_url = null;
                                
                                if (imageFile && imageFile.size > 0) {
                                    image_url = await handleImageUpload(imageFile);
                                }

                                const newItem = {
                                    name: sanitize(formData.get('name')),
                                    price: parseFloat(formData.get('price')),
                                    category: formData.get('category'),
                                    image_url: image_url,
                                    description: sanitize(formData.get('description')),
                                    is_available: true
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
                                    <select name="category" required className="glass" style={{ flex: 1, padding: '16px', borderRadius: '16px', color: 'var(--text-main)', outline: 'none', appearance: 'none' }}>
                                        <option value="">Select Category</option>
                                        {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                                    </select>
                                </div>
                                <textarea name="description" placeholder="Description" className="glass" style={{ padding: '16px', borderRadius: '16px', color: 'var(--text-main)', minHeight: '80px', outline: 'none', resize: 'none' }}></textarea>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '4px' }}>Item Image</p>
                                    <input type="file" name="image" accept="image/*" className="glass" style={{ padding: '12px', borderRadius: '16px', color: 'var(--text-main)', outline: 'none' }} />
                                </div>
                                <button type="submit" disabled={isUploading} style={{ padding: '16px', backgroundColor: 'var(--accent-white)', color: 'var(--bg-dark)', fontWeight: '700', borderRadius: '16px', marginTop: '8px', opacity: isUploading ? 0.5 : 1 }}>
                                    {isUploading ? 'Uploading...' : 'Add Menu Item'}
                                </button>
                            </form>

                            <input 
                                type="text" 
                                placeholder="🔍 Search menu items..." 
                                value={menuSearch}
                                onChange={(e) => setMenuSearch(e.target.value)}
                                className="glass"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    borderRadius: '16px',
                                    color: 'var(--text-main)',
                                    outline: 'none',
                                    marginBottom: '16px'
                                }}
                            />

                            <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '8px' }}>
                                {menuItems.filter(item => item.name.toLowerCase().includes(menuSearch.toLowerCase())).map(item => (
                                    <div key={item.id} className="glass" style={{ padding: '16px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            {item.image_url && <img src={item.image_url} alt={item.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', opacity: item.is_available === false ? 0.4 : 1 }} />}
                                            <span style={{ fontWeight: '600', color: item.is_available === false ? 'var(--text-muted)' : 'var(--text-main)', textDecoration: item.is_available === false ? 'line-through' : 'none' }}>
                                                {item.name}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <button 
                                                onClick={async () => {
                                                    await supabase.from('menu_items').update({ is_available: item.is_available === false ? true : false }).eq('id', item.id);
                                                    fetchMenuItems();
                                                }}
                                                style={{ color: item.is_available === false ? '#10b981' : '#f59e0b', background: 'var(--glass)', border: '1px solid var(--border-subtle)', padding: '6px 12px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                                            >
                                                {item.is_available === false ? 'Mark Available' : 'Mark Unavailable'}
                                            </button>
                                            <button onClick={() => setMappingItem(item)} style={{ color: '#60a5fa', background: 'var(--glass)', border: '1px solid var(--border-subtle)', padding: '6px 12px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>Recipe</button>
                                            <button onClick={() => setEditItem(item)} style={{ color: 'var(--accent-purple)', background: 'var(--glass)', border: '1px solid var(--border-subtle)', padding: '6px 12px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>Edit</button>
                                            <button
                                                onClick={async () => {
                                                    if (confirm(`Delete ${item.name}?`)) {
                                                        await supabase.from('menu_items').delete().eq('id', item.id);
                                                        fetchMenuItems();
                                                    }
                                                }}
                                                style={{ color: '#f87171', background: 'none', border: 'none', padding: '6px', cursor: 'pointer', fontSize: '1rem' }}
                                            >✕</button>
                                        </div>
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

                            <button
                                onClick={() => setQrTable({ id: 0, isTakeaway: true })}
                                style={{
                                    width: '100%',
                                    marginTop: '20px',
                                    padding: '16px',
                                    backgroundColor: 'var(--glass)',
                                    color: 'var(--text-main)',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: '16px',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                }}
                            >
                                📋 + Generate Parcel QR (Table 0)
                            </button>

                            <button
                                onClick={() => setShowBulkQR(true)}
                                style={{
                                    width: '100%',
                                    marginTop: '12px',
                                    padding: '18px',
                                    backgroundColor: 'var(--accent-white)',
                                    color: 'var(--bg-dark)',
                                    fontWeight: '800',
                                    borderRadius: '18px',
                                    cursor: 'pointer',
                                    boxShadow: '0 8px 32px rgba(255,255,255,0.1)',
                                    letterSpacing: '-0.01em'
                                }}
                            >
                                🖨️ Bulk Print QR Cards
                            </button>
                        </div>
                    </div>
                ) : activeTab === 'categories' ? (
                    <div className="glass" style={{ padding: '32px', borderRadius: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ color: 'var(--text-main)', fontSize: '1.6rem', fontWeight: '800' }}>📂 Category Management</h2>
                        </div>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            const imageFile = formData.get('image');
                            let image_url = null;
                            
                            if (imageFile && imageFile.size > 0) {
                                image_url = await handleImageUpload(imageFile);
                            }

                            const { error } = await supabase.from('categories').insert({
                                name: sanitize(formData.get('name')),
                                image_url: image_url
                            });

                            if (error) alert(error.message);
                            else {
                                e.target.reset();
                                fetchCategories();
                            }
                        }} style={{ display: 'flex', gap: '16px', marginBottom: '32px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div style={{ flex: 2, minWidth: '200px' }}>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px', marginLeft: '4px' }}>Category Name</p>
                                <input name="name" placeholder="e.g. Burgers" required className="glass" style={{ width: '100%', padding: '14px 20px', borderRadius: '16px', color: 'var(--text-main)', outline: 'none' }} />
                            </div>
                            <div style={{ flex: 1, minWidth: '150px' }}>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px', marginLeft: '4px' }}>Image</p>
                                <input type="file" name="image" accept="image/*" className="glass" style={{ width: '100%', padding: '10px', borderRadius: '16px', color: 'var(--text-main)', outline: 'none', fontSize: '0.8rem' }} />
                            </div>
                            <button type="submit" disabled={isUploading} style={{ padding: '14px 28px', backgroundColor: 'var(--accent-white)', color: 'var(--bg-dark)', fontWeight: '700', borderRadius: '16px', height: '48px', opacity: isUploading ? 0.5 : 1 }}>
                                {isUploading ? 'Uploading...' : 'Add Category'}
                            </button>
                        </form>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                            {categories.map(cat => (
                                <div key={cat.id} className="glass" style={{ padding: '20px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        {cat.image_url ? (
                                            <img src={cat.image_url} alt={cat.name} style={{ width: '50px', height: '50px', borderRadius: '12px', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '50px', height: '50px', borderRadius: '12px', backgroundColor: 'var(--glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>📂</div>
                                        )}
                                        <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>{cat.name}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button onClick={() => setEditCategory(cat)} style={{ color: 'var(--accent-purple)', background: 'none', border: 'none', fontWeight: '700', cursor: 'pointer' }}>Edit</button>
                                        <button
                                            onClick={async () => {
                                                if (confirm(`Delete category ${cat.name}? Items in this category will become Uncategorized.`)) {
                                                    await supabase.from('categories').delete().eq('id', cat.id);
                                                    await supabase.from('menu_items').update({ category: 'Uncategorized' }).eq('category', cat.name);
                                                    fetchCategories();
                                                    fetchMenuItems();
                                                }
                                            }}
                                            style={{ color: '#f87171', background: 'none', border: 'none', padding: '8px', cursor: 'pointer' }}
                                        >✕</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : activeTab === 'customers' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div className="glass" style={{ padding: '32px', borderRadius: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h1 style={{ fontSize: '1.6rem', fontWeight: '800' }}>Customer Directory</h1>
                                <input 
                                    type="text" 
                                    placeholder="🔍 Search by name or phone..." 
                                    className="glass"
                                    value={customerSearch}
                                    onChange={(e) => setCustomerSearch(e.target.value)}
                                    style={{ padding: '12px 20px', borderRadius: '16px', color: 'white', width: '300px', outline: 'none' }}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                                {customerContacts
                                    .filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone_number.includes(customerSearch))
                                    .map(customer => (
                                        <div key={customer.id} className="glass" style={{ padding: '20px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '24px', background: 'var(--accent-white)', color: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.2rem' }}>
                                                {customer.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '2px' }}>{customer.name}</h3>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>📞 {customer.phone_number}</p>
                                            </div>
                                            <button 
                                                onClick={async () => {
                                                    if (confirm(`Delete contact for ${customer.name}?`)) {
                                                        await supabase.from('customers').delete().eq('id', customer.id);
                                                        fetchCustomers();
                                                    }
                                                }}
                                                style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}
                                            >✕</button>
                                        </div>
                                    ))}
                                {customerContacts.length === 0 && (
                                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                                        No customer records found yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'inventory' ? (
                    <InventoryManager 
                        materials={materials} setMaterials={setMaterials}
                        recipes={invRecipes} setRecipes={setInvRecipes}
                        consumeLog={consumeLog} setConsumeLog={setConsumeLog}
                        restockLog={restockLog} setRestockLog={setRestockLog}
                        menuItems={menuItems}
                    />
                 ) : activeTab === 'floor' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
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

                                    {(isOccupied || hasNewOrder) ? (
                                        <div style={{ marginTop: '24px', color: isOccupied ? 'var(--bg-dark)' : 'var(--text-main)', fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.05em' }}>
                                            VIEW ORDER →
                                        </div>
                                    ) : (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowManualOrder(table.id); }}
                                            style={{ marginTop: '20px', padding: '8px 16px', backgroundColor: 'var(--glass)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'var(--text-main)', fontSize: '0.75rem', fontWeight: '700' }}
                                        >
                                            + Manual Order
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : activeTab === 'takeaway' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <button
                            onClick={() => setShowManualOrder(0)}
                            style={{
                                padding: '20px',
                                background: 'var(--accent-white)',
                                color: 'var(--bg-dark)',
                                borderRadius: '24px',
                                fontWeight: '800',
                                fontSize: '1rem',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px',
                                boxShadow: '0 8px 32px rgba(255,255,255,0.1)',
                                marginBottom: '8px'
                            }}
                        >
                            📦 + Place Manual Parcel Order
                        </button>
                        {orders.filter(o => o.table_id === 0).map(order => {
                            const meta = order.items.find(i => i.type === 'METADATA');
                            const parcelNo = meta ? `P-${meta.takeaway_no}` : order.id;
                            const displayItems = order.items.filter(i => i.type !== 'METADATA');
                            
                            return (
                                <div key={order.id} className="glass" style={{ padding: '24px', borderRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                                            <span style={{ fontSize: '1.4rem', fontWeight: '700', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>Order #{parcelNo}</span>
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
                                            {displayItems.map(i => `${i.qty}x ${i.name}`).join(', ')}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: '24px' }}>
                                        <p style={{ fontSize: '1.6rem', fontWeight: '700', marginBottom: '4px', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>₹{order.total}</p>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
                                            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            {order.status === 'new' ? (
                                                <button
                                                    onClick={() => acceptOrder(order.id, 0)}
                                                    style={{ padding: '8px 20px', fontSize: '0.9rem', backgroundColor: 'var(--accent-white)', color: 'var(--bg-dark)', borderRadius: '16px', fontWeight: '700' }}
                                                >
                                                    Ready
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => completeTakeaway(order.id)}
                                                    style={{ padding: '8px 20px', fontSize: '0.9rem', backgroundColor: '#4ade80', color: '#000', borderRadius: '16px', fontWeight: '700' }}
                                                >
                                                    Handover
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setInvoiceOrder(order); }}
                                                style={{ padding: '8px 20px', fontSize: '0.9rem', backgroundColor: 'var(--glass)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', borderRadius: '16px', fontWeight: '600' }}
                                            >
                                                Invoice
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {orders.filter(o => o.table_id === 0).length === 0 && (
                            <div style={{ textAlign: 'center', padding: '120px 0', color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: '500', letterSpacing: '-0.01em' }}>
                                No active parcel orders
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {orders.filter(o => o.table_id !== 0).map(order => (
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
                        {orders.filter(o => o.table_id !== 0).length === 0 && (
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
                                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                                    {(() => {
                                        if (selectedTableOrder.table_id === 0) {
                                            const meta = selectedTableOrder.items.find(i => i.type === 'METADATA');
                                            return `Parcel Order #${meta ? `P-${meta.takeaway_no}` : selectedTableOrder.id}`;
                                        }
                                        return `Table ${selectedTableOrder.table_id} Order`;
                                    })()}
                                </h2>
                                <button onClick={() => setSelectedTableOrder(null)} style={{ backgroundColor: 'var(--glass)', border: '1px solid var(--border-subtle)', width: '36px', height: '36px', borderRadius: '18px', fontSize: '1.2rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>✕</button>
                            </div>

                            <div style={{ marginBottom: '32px' }}>
                                {(() => {
                                    const validItems = selectedTableOrder.items.filter(i => i.type !== 'METADATA' && i.type !== 'PAYMENT_METADATA');
                                    const dineInItems = validItems.filter(i => !i.isParcel);
                                    const parcelItems = validItems.filter(i => i.isParcel);

                                    const renderItem = (item, idxKey) => (
                                        <div key={idxKey} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '1.1rem', color: 'var(--text-main)', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--glass)', padding: '4px 8px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                                                    <button 
                                                        onClick={() => handleUpdateItemQty(selectedTableOrder.id, item.name, -1, item.isParcel)}
                                                        style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '1.2rem', cursor: 'pointer', padding: '0 4px', fontWeight: 'bold' }}
                                                    >
                                                        -
                                                    </button>
                                                    <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: '700', fontSize: '0.95rem' }}>{item.qty}</span>
                                                    <button 
                                                        onClick={() => handleUpdateItemQty(selectedTableOrder.id, item.name, 1, item.isParcel)}
                                                        style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '1.2rem', cursor: 'pointer', padding: '0 4px', fontWeight: 'bold' }}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <span style={{ fontWeight: '500' }}>{item.name}</span>
                                            </div>
                                            <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>₹{item.price * item.qty}</span>
                                        </div>
                                    );

                                    return (
                                        <>
                                            {dineInItems.map((item, i) => renderItem(item, `dine-${i}`))}
                                            {parcelItems.length > 0 && (
                                                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                                                    <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ fontSize: '1.2rem' }}>📦</span>
                                                        <span style={{ fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Parcel Items</span>
                                                    </div>
                                                    {parcelItems.map((item, i) => renderItem(item, `parcel-${i}`))}
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px', marginTop: '20px', display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '1.6rem', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: '500', alignSelf: 'center' }}>Total</span>
                                    <span>₹{selectedTableOrder.total}</span>
                                </div>

                                {/* Add Item Section */}
                                <div style={{ marginTop: '20px', borderTop: '1px dashed var(--border-subtle)', paddingTop: '20px' }}>
                                    {!isAddingItem ? (
                                        <button 
                                            onClick={() => setIsAddingItem(true)}
                                            style={{ 
                                                width: '100%', 
                                                padding: '12px', 
                                                backgroundColor: 'rgba(255,255,255,0.05)', 
                                                border: '1px solid var(--border-subtle)', 
                                                borderRadius: '12px', 
                                                color: 'var(--text-main)', 
                                                fontWeight: '600',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            + Add Item
                                        </button>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <input 
                                                    type="text" 
                                                    placeholder="Search item..." 
                                                    value={addItemSearch}
                                                    onChange={(e) => setAddItemSearch(e.target.value)}
                                                    autoFocus
                                                    className="glass"
                                                    style={{ flex: 1, padding: '10px 16px', borderRadius: '12px', color: 'white', border: '1px solid var(--border-subtle)', outline: 'none', fontSize: '0.9rem' }}
                                                />
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontSize: '0.85rem', cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.05)', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--border-subtle)', whiteSpace: 'nowrap' }}>
                                                    <input type="checkbox" checked={isAddNewAsParcel} onChange={(e) => setIsAddNewAsParcel(e.target.checked)} style={{ cursor: 'pointer' }} />
                                                    Add as Parcel
                                                </label>
                                                <button onClick={() => { setIsAddingItem(false); setAddItemSearch(''); setIsAddNewAsParcel(false); }} style={{ background: 'var(--glass)', border: '1px solid var(--border-subtle)', width: '40px', borderRadius: '12px', color: 'white' }}>✕</button>
                                            </div>
                                            {addItemSearch && (
                                                <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px' }}>
                                                    {menuItems
                                                        .filter(i => i.is_available !== false)
                                                        .filter(i => i.name.toLowerCase().includes(addItemSearch.toLowerCase()))
                                                        .map(item => (
                                                            <button 
                                                                key={item.id}
                                                                onClick={async () => {
                                                                    await placeManualOrder(selectedTableOrder.table_id, [{ ...item, qty: 1, isParcel: isAddNewAsParcel }]);
                                                                    setIsAddingItem(false);
                                                                    setAddItemSearch('');
                                                                    setIsAddNewAsParcel(false);
                                                                    // The real-time subscription or fetchInitialData inside placeManualOrder will update selectedTableOrder via orders state
                                                                    // But since selectedTableOrder is local state, we should find it again
                                                                    const updatedOrders = await supabase.from('orders').select('*');
                                                                    if (updatedOrders.data) {
                                                                        const latest = updatedOrders.data.find(o => o.id === selectedTableOrder.id);
                                                                        if (latest) setSelectedTableOrder(latest);
                                                                    }
                                                                }}
                                                                style={{ 
                                                                    display: 'flex', 
                                                                    justifyContent: 'space-between', 
                                                                    padding: '12px 16px', 
                                                                    backgroundColor: 'rgba(255,255,255,0.03)', 
                                                                    border: '1px solid var(--border-subtle)', 
                                                                    borderRadius: '12px', 
                                                                    color: 'white',
                                                                    textAlign: 'left',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                <span style={{ fontWeight: '500', flex: 1, marginRight: '12px', whiteSpace: 'normal', wordBreak: 'break-word' }}>{item.name}</span>
                                                                <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>₹{item.price}</span>
                                                            </button>
                                                        ))
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Customer Info for Direct Payment */}
                                <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                                    <div style={{ position: 'relative' }}>
                                        <input 
                                            type="text" 
                                            placeholder="Customer Phone (10 digits)"
                                            className="glass"
                                            value={payPhone}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                setPayPhone(val);
                                                checkCustomerByPhone(val);
                                            }}
                                            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', color: 'white', border: '1px solid var(--border-subtle)', outline: 'none', fontSize: '1rem' }}
                                        />
                                        {payExists && (
                                            <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: '#4ade80', fontWeight: '800' }}>
                                                ✅ Exists
                                            </span>
                                        )}
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="Customer Name"
                                        className="glass"
                                        value={payName}
                                        onChange={(e) => setPayName(e.target.value)}
                                        style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', color: 'white', border: '1px solid var(--border-subtle)', outline: 'none', fontSize: '1rem' }}
                                    />
                                    {payExists && (
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', paddingLeft: '4px' }}>* Returning customer detected</p>
                                    )}
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
                                    onClick={() => markTableFree(selectedTableOrder.table_id, 'Cash')}
                                    style={{ flex: 1, padding: '16px', backgroundColor: '#fbbf24', color: '#000', fontWeight: '700', borderRadius: '16px', cursor: 'pointer' }}
                                >
                                    Paid CASH
                                </button>
                                <button
                                    onClick={() => markTableFree(selectedTableOrder.table_id, 'Online')}
                                    style={{ flex: 1, padding: '16px', backgroundColor: '#60a5fa', color: '#000', fontWeight: '700', borderRadius: '16px', cursor: 'pointer' }}
                                >
                                    Paid ONLINE
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
            </div>

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
                    zIndex: 3000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px'
                }}>
                    <div className="glass animate-fade" style={{
                        width: '100%',
                        maxWidth: '430px',
                        borderRadius: '32px',
                        padding: '40px',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '32px',
                        backgroundColor: 'var(--bg-surface)',
                        position: 'relative',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        <button 
                            onClick={() => setQrTable(null)} 
                            style={{ 
                                position: 'absolute', 
                                top: '20px', 
                                right: '20px', 
                                background: 'var(--glass)', 
                                border: '1px solid var(--border-subtle)', 
                                width: '36px', 
                                height: '36px', 
                                borderRadius: '18px', 
                                color: 'white', 
                                cursor: 'pointer',
                                zIndex: 10
                            }}
                        >✕</button>

                        {/* Designed QR Card for Printing */}
                        <div id="qr-to-print" style={{ 
                            position: 'relative',
                            width: '320px',
                            height: '480px',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
                            overflow: 'hidden',
                            backgroundColor: 'black'
                        }}>
                            <img src="/qr-template.jpg" style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'fill',
                                zIndex: 0
                            }} alt="template background" />

                            <div style={{
                                position: 'absolute',
                                top: '23.5%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '61%',
                                height: '40.66%',
                                backgroundColor: '#ffffff',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '12px',
                                zIndex: 1
                            }}>
                                <QRCodeSVG
                                    value={`${qrBaseUrl.replace(/\/$/, '')}/menu?table=${qrTable.id}&tk=${qrTable.isTakeaway ? '1' : '0'}`}
                                    size={256}
                                    style={{ width: '100%', height: '100%' }}
                                    bgColor="#ffffff"
                                    fgColor="#000000"
                                    level="H"
                                    includeMargin={false}
                                />
                                <div style={{ fontSize: '0.8rem', fontWeight: '900', color: '#000', marginTop: '6px', textAlign: 'center', fontFamily: 'sans-serif' }}>
                                    {qrTable.isTakeaway ? 'PARCEL' : `TABLE ${qrTable.id}`}
                                </div>
                            </div>
                        </div>

                        {/* Mobile link input removed per request */}

                        <button
                            className="no-print"
                            onClick={() => {
                                const style = document.createElement('style');
                                style.innerHTML = `
                                    @media print {
                                        body * { visibility: hidden !important; }
                                        #qr-to-print, #qr-to-print * { visibility: visible !important; }
                                        #qr-to-print { 
                                            position: absolute !important; 
                                            left: 0 !important; 
                                            top: 0 !important; 
                                            margin: 0 !important;
                                            padding: 0 !important;
                                            width: 100mm !important;
                                            height: 150mm !important;
                                            box-shadow: none !important;
                                            border: none !important;
                                            print-color-adjust: exact !important;
                                            -webkit-print-color-adjust: exact !important;
                                            display: block !important;
                                        }
                                    }
                                `;
                                document.head.appendChild(style);
                                window.print();
                                document.head.removeChild(style);
                            }}
                            style={{ width: '100%', padding: '16px', backgroundColor: 'var(--accent-white)', color: 'var(--bg-dark)', fontWeight: '700', borderRadius: '16px', letterSpacing: '-0.01em', fontSize: '1rem', cursor: 'pointer' }}
                        >
                            🖨️ Print QR Design
                        </button>
                    </div>
                </div>
            )}

            {/* Real-time Order Popup */}
            {newOrder && (
                <OrderPopup
                    order={newOrder}
                    onAccept={acceptOrder}
                    onDismiss={() => rejectOrder(newOrder.id)}
                />
            )}

            {/* Invoice Modal */}
            <InvoiceModal
                order={invoiceOrder}
                isOpen={!!invoiceOrder}
                onClose={() => setInvoiceOrder(null)}
                onPaid={(method) => handleOrderPaid(invoiceOrder.id, method)}
            />

            {/* Bulk QR Modal */}
            <BulkQRModal
                tables={tables}
                isOpen={showBulkQR}
                onClose={() => setShowBulkQR(false)}
                qrBaseUrl={qrBaseUrl}
            />

            {/* Recipe Mapping Modal */}
            {mappingItem && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}>
                    <div className="glass" style={{ width: '100%', maxWidth: '480px', borderRadius: '24px', padding: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Recipe: {mappingItem.name}</h3>
                            <button onClick={() => { setMappingItem(null); setNewMatId(''); setNewMatQty(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem' }}>✕</button>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>Define raw materials used per serving of this item.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', maxHeight: '300px', overflowY: 'auto', paddingRight: '8px' }}>
                            {(invRecipes.find(r => r.menuItemId === mappingItem.id)?.recipe || []).map((ing, i) => {
                                const mat = materials.find(m => m.id === ing.materialId);
                                return (
                                    <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
                                        <span style={{ flex: 1, fontWeight: '600' }}>{mat?.name || 'Unknown'}</span>
                                        <span style={{ color: 'var(--text-muted)' }}>{ing.qty} {mat?.unit}</span>
                                        <button
                                            onClick={() => {
                                                const current = invRecipes.find(r => r.menuItemId === mappingItem.id);
                                                const newRecipe = current.recipe.filter((_, idx) => idx !== i);
                                                setInvRecipes(prev => prev.map(r => r.menuItemId === mappingItem.id ? { ...r, recipe: newRecipe } : r));
                                            }}
                                            style={{ color: '#f87171', background: 'none', border: 'none' }}
                                        >✕</button>
                                    </div>
                                );
                            })}

                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                <select
                                    className="glass"
                                    value={newMatId}
                                    onChange={(e) => setNewMatId(e.target.value)}
                                    style={{ flex: 1, padding: '12px', borderRadius: '12px', color: 'var(--text-main)', fontSize: '0.85rem' }}
                                >
                                    <option value="">Select Material</option>
                                    {materials.map(m => <option key={m.id} value={m.id} style={{color:'black'}}>{m.name}</option>)}
                                </select>
                                <input
                                    type="number"
                                    placeholder="Qty"
                                    value={newMatQty}
                                    onChange={(e) => setNewMatQty(e.target.value)}
                                    className="glass"
                                    style={{ width: '80px', padding: '12px', borderRadius: '12px', color: 'var(--text-main)', fontSize: '0.85rem' }}
                                />
                                <button
                                    onClick={() => {
                                        if (!newMatId || !newMatQty) return;
                                        const existing = invRecipes.find(r => r.menuItemId === mappingItem.id);
                                        if (existing) {
                                            setInvRecipes(prev => prev.map(r => r.menuItemId === mappingItem.id ? { ...r, recipe: [...r.recipe, { materialId: newMatId, qty: Number(newMatQty) }] } : r));
                                        } else {
                                            setInvRecipes(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), name: mappingItem.name, menuItemId: mappingItem.id, recipe: [{ materialId: newMatId, qty: Number(newMatQty) }] }]);
                                        }
                                        setNewMatQty('');
                                    }}
                                    style={{ padding: '12px', background: 'var(--accent-white)', color: 'var(--bg-dark)', borderRadius: '12px', fontWeight: '700' }}
                                >Add</button>
                            </div>
                        </div>

                        <button onClick={() => setMappingItem(null)} style={{ width: '100%', padding: '16px', background: 'var(--glass)', border: '1px solid var(--border-subtle)', borderRadius: '16px', fontWeight: '700', color: 'var(--text-main)' }}>Done</button>
                    </div>
                </div>
            )}
            {/* Manual Order Modal */}
            {showManualOrder !== null && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', padding: '20px' }}>
                    <div className="glass" style={{ width: '100%', maxWidth: '900px', height: '90vh', borderRadius: '32px', padding: '32px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Manual Order — {showManualOrder === 0 ? 'Takeaway' : `Table ${showManualOrder}`}</h2>
                            <button onClick={() => { setShowManualOrder(null); setManualCart([]); setManualSearch(''); setManualCategory('all'); }} style={{ background: 'var(--glass)', border: '1px solid var(--border-subtle)', width: '40px', height: '40px', borderRadius: '20px', color: 'white' }}>✕</button>
                        </div>

                        <div style={{ flex: 1, display: 'flex', gap: '24px', overflow: 'hidden' }}>
                            {/* Menu Selection */}
                            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', paddingRight: '8px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <input 
                                        type="text" 
                                        placeholder="🔍 Search items by name..." 
                                        value={manualSearch}
                                        onChange={(e) => setManualSearch(e.target.value)}
                                        className="glass" 
                                        style={{ width: '100%', padding: '14px 20px', borderRadius: '16px', color: 'white', border: '1px solid var(--border-subtle)', outline: 'none' }}
                                    />
                                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                                        {['all', ...categories.map(c => c.name)].map(catName => (
                                            <button 
                                                key={catName} 
                                                onClick={() => setManualCategory(catName)}
                                                style={{ 
                                                    padding: '8px 20px', 
                                                    backgroundColor: manualCategory === catName ? 'var(--accent-white)' : 'var(--glass)', 
                                                    color: manualCategory === catName ? 'var(--bg-dark)' : 'white', 
                                                    border: '1px solid var(--border-subtle)', 
                                                    borderRadius: '20px', 
                                                    fontSize: '0.8rem', 
                                                    fontWeight: '700',
                                                    whiteSpace: 'nowrap',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {catName.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                                    {menuItems
                                        .filter(i => i.is_available !== false)
                                        .filter(i => manualCategory === 'all' || i.category === manualCategory)
                                        .filter(i => i.name.toLowerCase().includes(manualSearch.toLowerCase()))
                                        .map(item => (
                                            <div 
                                                key={item.id} 
                                                onClick={() => {
                                                    const existing = manualCart.find(i => i.id === item.id);
                                                    if (existing) {
                                                        setManualCart(prev => prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
                                                    } else {
                                                        setManualCart(prev => [...prev, { ...item, qty: 1 }]);
                                                    }
                                                }}
                                                className="glass" 
                                                style={{ padding: '12px', borderRadius: '20px', textAlign: 'center', cursor: 'pointer' }}
                                            >
                                                <div style={{ width: '100%', aspectRatio: '1', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                                    {item.image_url ? <img src={item.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🍽️'}
                                                </div>
                                                <p style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '2px' }}>{item.name}</p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>₹{item.price}</p>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>

                            {/* Cart Summary */}
                            <div className="glass" style={{ flex: 1, padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ marginBottom: '20px', fontSize: '1.1rem' }}>Selected Items</h3>
                                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {manualCart.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>{item.name}</p>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.qty} x ₹{item.price}</p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button 
                                                    onClick={() => {
                                                        setManualCart(prev => prev.map(i => i.id === item.id ? { ...i, qty: Math.max(0, i.qty - 1) } : i).filter(i => i.qty > 0));
                                                    }}
                                                    style={{ width: '24px', height: '24px', borderRadius: '12px', border: '1px solid var(--border-subtle)', color: 'white' }}
                                                >-</button>
                                                <button 
                                                    onClick={() => {
                                                        setManualCart(prev => prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
                                                    }}
                                                    style={{ width: '24px', height: '24px', borderRadius: '12px', border: '1px solid var(--border-subtle)', color: 'white' }}
                                                >+</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontWeight: '800', fontSize: '1.2rem' }}>
                                        <span>Total</span>
                                        <span>₹{manualCart.reduce((acc, curr) => acc + (curr.price * curr.qty), 0)}</span>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if (manualCart.length === 0) return;
                                            placeManualOrder(showManualOrder, manualCart);
                                            setManualCart([]);
                                        }}
                                        style={{ width: '100%', padding: '16px', background: 'var(--accent-white)', color: 'var(--bg-dark)', borderRadius: '16px', fontWeight: '800' }}
                                    >
                                        Place Manual Order
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Edit Menu Item Modal */}
            {editItem && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 6000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', padding: '20px' }}>
                    <div className="glass" style={{ width: '100%', maxWidth: '500px', borderRadius: '32px', padding: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Edit Item: {editItem.name}</h2>
                            <button onClick={() => setEditItem(null)} style={{ background: 'var(--glass)', border: '1px solid var(--border-subtle)', width: '36px', height: '36px', borderRadius: '18px', color: 'white' }}>✕</button>
                        </div>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            const imageFile = formData.get('image');
                            let image_url = editItem.image_url;
                            
                            if (imageFile && imageFile.size > 0) {
                                image_url = await handleImageUpload(imageFile);
                            }

                            const updates = {
                                name: sanitize(formData.get('name')),
                                price: Math.max(0, parseInt(formData.get('price')) || 0),
                                category: sanitize(formData.get('category')),
                                description: sanitize(formData.get('description')),
                                image_url: image_url,
                                is_veg: formData.get('is_veg') === 'on',
                                is_signature: formData.get('is_signature') === 'on',
                                discount_pct: Math.min(100, Math.max(0, parseInt(formData.get('discount_pct')) || 0))
                            };

                            const { error } = await supabase.from('menu_items').update(updates).eq('id', editItem.id);
                            if (error) alert(error.message);
                            else {
                                setEditItem(null);
                                fetchMenuItems();
                            }
                        }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <input name="name" defaultValue={editItem.name} placeholder="Item Name" required className="glass" style={{ padding: '14px', borderRadius: '14px', color: 'var(--text-main)', outline: 'none' }} />
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <input name="price" type="number" defaultValue={editItem.price} placeholder="Price" required className="glass" style={{ flex: 1, padding: '14px', borderRadius: '14px', color: 'var(--text-main)' }} />
                                <select name="category" defaultValue={editItem.category} className="glass" style={{ flex: 1, padding: '14px', borderRadius: '14px', color: 'var(--text-main)', appearance: 'none' }}>
                                    {categories.map(cat => <option key={cat.id} value={cat.name} style={{color:'black'}}>{cat.name}</option>)}
                                </select>
                            </div>
                            <textarea name="description" defaultValue={editItem.description} placeholder="Description" className="glass" style={{ padding: '14px', borderRadius: '14px', color: 'var(--text-main)', minHeight: '80px' }} />
                            <div style={{ fontSize: '0.8rem' }}>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Update Image (Optional)</p>
                                <input type="file" name="image" accept="image/*" className="glass" style={{ width: '100%', padding: '10px', borderRadius: '12px' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '20px', fontSize: '0.9rem' }}>
                                <label><input type="checkbox" name="is_veg" defaultChecked={editItem.is_veg} /> Veg</label>
                                <label><input type="checkbox" name="is_signature" defaultChecked={editItem.is_signature} /> Signature</label>
                            </div>
                            <button type="submit" disabled={isUploading} style={{ padding: '16px', backgroundColor: 'var(--accent-white)', color: 'var(--bg-dark)', fontWeight: '800', borderRadius: '16px', marginTop: '12px' }}>
                                {isUploading ? 'Uploading...' : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Edit Category Modal */}
            {editCategory && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 6000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', padding: '20px' }}>
                    <div className="glass" style={{ width: '100%', maxWidth: '500px', borderRadius: '32px', padding: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Edit Category: {editCategory.name}</h2>
                            <button onClick={() => setEditCategory(null)} style={{ background: 'var(--glass)', border: '1px solid var(--border-subtle)', width: '36px', height: '36px', borderRadius: '18px', color: 'white' }}>✕</button>
                        </div>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            const imageFile = formData.get('image');
                            let image_url = editCategory.image_url;
                            
                            if (imageFile && imageFile.size > 0) {
                                image_url = await handleImageUpload(imageFile);
                            }

                            const newName = sanitize(formData.get('name'));
                            const { error } = await supabase.from('categories').update({
                                name: newName,
                                image_url: image_url
                            }).eq('id', editCategory.id);

                            if (error) alert(error.message);
                            else {
                                // Sync menu items if name changed
                                if (newName !== editCategory.name) {
                                    await supabase.from('menu_items').update({ category: newName }).eq('category', editCategory.name);
                                }
                                setEditCategory(null);
                                fetchCategories();
                                fetchMenuItems();
                            }
                        }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <input name="name" defaultValue={editCategory.name} placeholder="Category Name" required className="glass" style={{ padding: '14px', borderRadius: '14px', color: 'var(--text-main)', outline: 'none' }} />
                            <div style={{ fontSize: '0.8rem' }}>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Update Image (Optional)</p>
                                <input type="file" name="image" accept="image/*" className="glass" style={{ width: '100%', padding: '10px', borderRadius: '12px' }} />
                            </div>
                            <button type="submit" disabled={isUploading} style={{ padding: '16px', backgroundColor: 'var(--accent-white)', color: 'var(--bg-dark)', fontWeight: '800', borderRadius: '16px', marginTop: '12px' }}>
                                {isUploading ? 'Uploading...' : 'Save Category Changes'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminPage;
