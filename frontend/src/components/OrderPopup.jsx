import React from 'react';

const OrderPopup = ({ order, onAccept, onDismiss, onUpdateItemQty }) => {
    if (!order) return null;

    return (
        <div className="order-popup-overlay animate-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
        }}>
            <div className="order-popup glass animate-fade" style={{
                width: '100%',
                maxWidth: '600px',
                borderRadius: '32px',
                backgroundColor: 'var(--bg-surface)',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px var(--border-subtle)',
                position: 'relative'
            }}>
                <button 
                    onClick={onDismiss}
                    style={{
                        position: 'absolute',
                        top: '20px',
                        right: '25px',
                        background: 'var(--glass)',
                        border: '1px solid var(--border-subtle)',
                        width: '36px',
                        height: '36px',
                        borderRadius: '18px',
                        color: 'var(--text-main)',
                        fontSize: '1.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 10
                    }}
                >
                    ✕
                </button>
                <div style={{
                    padding: '24px 32px',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <span style={{ fontSize: '24px' }}>🔔</span>
                    <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', letterSpacing: '-0.02em', fontWeight: '600' }}>New Order</h2>
                </div>

                <div style={{ padding: '32px' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '24px'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '1.5rem', fontWeight: '700', letterSpacing: '-0.02em' }}>
                                {(() => {
                                    if (order.table_id === 0) {
                                        const meta = order.items.find(i => i.type === 'METADATA');
                                        return meta ? `Parcel #TK-${meta.takeaway_no}` : 'Parcel';
                                    }
                                    return `Table ${order.table_id}`;
                                })()}
                            </span>
                            {/* Local Timer Logic */}
                            {(() => {
                                const [elapsed, setElapsed] = React.useState(0);
                                React.useEffect(() => {
                                    const start = new Date(order.created_at).getTime();
                                    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
                                    tick();
                                    const id = setInterval(tick, 1000);
                                    return () => clearInterval(id);
                                }, [order.created_at]);
                                
                                const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
                                const s = String(elapsed % 60).padStart(2, '0');
                                
                                return (
                                    <span style={{ 
                                        fontSize: '0.85rem', 
                                        fontWeight: '800', 
                                        color: elapsed > 300 ? '#f87171' : 'var(--teal)',
                                        fontFamily: 'monospace'
                                    }}>
                                        ⏱ {m}:{s} ELAPSED
                                    </span>
                                );
                            })()}
                        </div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div className="items-list" style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {order.items
                            .filter(i => i.type !== 'METADATA')
                            .map((item, idx) => (
                                <div
                                    key={idx}
                                    className={item.isNew ? 'premium-border' : ''}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        fontSize: '1.05rem',
                                        color: 'var(--text-main)',
                                        border: item.isNew ? 'none' : '1px solid var(--border-subtle)',
                                        borderRadius: '12px',
                                        padding: '12px 16px',
                                        backgroundColor: 'var(--bg-surface)',
                                    }}
                                >
                                    <span style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                backgroundColor: 'var(--glass)',
                                                padding: '4px 8px',
                                                borderRadius: '10px',
                                                border: '1px solid var(--border-subtle)',
                                            }}
                                        >
                                            <button
                                                onClick={() =>
                                                    onUpdateItemQty &&
                                                    onUpdateItemQty(order.id, item.name, -1, item.isParcel)
                                                }
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: 'var(--text-main)',
                                                    fontSize: '1.1rem',
                                                    cursor: 'pointer',
                                                    padding: '0 4px',
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                −
                                            </button>
                                            <span
                                                style={{
                                                    color: 'var(--bg-dark)',
                                                    backgroundColor: 'var(--accent-white)',
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '6px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '700',
                                                }}
                                            >
                                                {item.qty}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    onUpdateItemQty &&
                                                    onUpdateItemQty(order.id, item.name, 1, item.isParcel)
                                                }
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: 'var(--text-main)',
                                                    fontSize: '1.1rem',
                                                    cursor: 'pointer',
                                                    padding: '0 4px',
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                +
                                            </button>
                                        </div>
                                        <span style={{ fontWeight: '500' }}>{item.name}</span>
                                    </span>
                                    <span style={{ fontWeight: '600' }}>₹{item.price * item.qty}</span>
                                </div>
                            ))}
                    </div>

                    <div style={{
                        borderTop: '1px solid var(--border-subtle)',
                        paddingTop: '20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '32px'
                    }}>
                        <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Total</span>
                        <span style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>₹{order.total}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <button
                            onClick={onDismiss}
                            style={{ flex: 1, padding: '16px', backgroundColor: 'var(--glass)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', fontWeight: '600', fontSize: '1rem', borderRadius: '16px' }}
                        >
                            Dismiss
                        </button>
                        <button
                            onClick={() => onAccept(order.id, order.table_id)}
                            style={{ flex: 2, padding: '16px', backgroundColor: 'var(--accent-white)', color: 'var(--bg-dark)', fontWeight: '700', fontSize: '1rem', borderRadius: '16px' }}
                        >
                            Take Order
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderPopup;
