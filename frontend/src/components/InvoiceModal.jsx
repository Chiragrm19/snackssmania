import React from 'react';

const InvoiceModal = ({ order, isOpen, onClose }) => {
    if (!isOpen || !order) return null;

    const invoiceNumber = `INV-${new Date().getFullYear()}-${order.id.toString().padStart(4, '0')}`;
    const orderNumber = `ORD-${order.id.toString().padStart(4, '0')}`;

    return (
        <div className="invoice-overlay animate-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
        }}>
            <div className="invoice-container animate-fade" style={{
                width: '100%',
                maxWidth: '560px',
                backgroundColor: '#ffffff',
                color: '#111111',
                padding: '40px 48px',
                borderRadius: '16px',
                position: 'relative',
                boxShadow: '0 24px 48px rgba(0,0,0,0.5)'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '24px',
                        right: '24px',
                        backgroundColor: 'rgba(0,0,0,0.05)',
                        border: 'none',
                        width: '32px',
                        height: '32px',
                        borderRadius: '16px',
                        fontSize: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#666'
                    }}
                >
                    ×
                </button>

                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '1.8rem', marginBottom: '4px', letterSpacing: '-0.03em', fontWeight: '700' }}>daawat</h1>
                    <p style={{ color: '#888', fontSize: '0.85rem', letterSpacing: '0.05em' }}>PREMIUM DINING</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', borderBottom: '1px solid #eaeaea', paddingBottom: '24px' }}>
                    <div>
                        <p style={{ color: '#888', fontSize: '0.8rem', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invoice To</p>
                        <p style={{ fontSize: '1.2rem', fontWeight: '600', letterSpacing: '-0.02em' }}>Table {order.table_id}</p>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.9rem', color: '#555' }}>
                        <p style={{ marginBottom: '4px' }}><strong>INV:</strong> {invoiceNumber}</p>
                        <p style={{ marginBottom: '4px' }}><strong>ORD:</strong> {orderNumber}</p>
                        <p><strong>DATE:</strong> {new Date(order.created_at || Date.now()).toLocaleDateString()}</p>
                    </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '12px 0', borderBottom: '2px solid #111', fontSize: '0.85rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Item</th>
                            <th style={{ textAlign: 'center', padding: '12px 0', borderBottom: '2px solid #111', fontSize: '0.85rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Qty</th>
                            <th style={{ textAlign: 'right', padding: '12px 0', borderBottom: '2px solid #111', fontSize: '0.85rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price</th>
                            <th style={{ textAlign: 'right', padding: '12px 0', borderBottom: '2px solid #111', fontSize: '0.85rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #eaeaea' }}>
                                <td style={{ padding: '16px 0', fontWeight: '500' }}>{item.name}</td>
                                <td style={{ textAlign: 'center', padding: '16px 0', color: '#666' }}>{item.qty}</td>
                                <td style={{ textAlign: 'right', padding: '16px 0', color: '#666' }}>₹{item.price}</td>
                                <td style={{ textAlign: 'right', padding: '16px 0', fontWeight: '600' }}>₹{item.price * item.qty}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '48px', color: '#666', fontSize: '0.95rem' }}>
                        <span>Subtotal</span>
                        <span>₹{order.total}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '48px', fontWeight: '700', fontSize: '1.6rem', marginTop: '8px', letterSpacing: '-0.02em' }}>
                        <span>Total</span>
                        <span>₹{order.total}</span>
                    </div>
                </div>

                <div style={{ marginTop: '64px', display: 'flex', gap: '16px' }}>
                    <button
                        onClick={onClose}
                        style={{ flex: 1, padding: '16px', backgroundColor: '#f5f5f5', color: '#111', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem' }}
                    >
                        Close
                    </button>
                    <button
                        onClick={() => window.print()}
                        style={{ flex: 2, padding: '16px', backgroundColor: '#111', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem' }}
                    >
                        Print Receipt
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InvoiceModal;
