import React, { useState } from 'react';

const InvoiceModal = ({ order, isOpen, onClose, onPaid }) => {
    const [paymentMethod, setPaymentMethod] = useState('Cash');

    if (!isOpen || !order) return null;

    const handlePrint = () => {
        if (onPaid) onPaid(paymentMethod);
        window.print();
    };

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
            <style>
                {`
                    @media print {
                        .no-print { display: none !important; }
                        .invoice-overlay { 
                            position: static !important; 
                            background: none !important; 
                            backdrop-filter: none !important;
                            padding: 0 !important;
                        }
                        .invoice-container {
                            box-shadow: none !important;
                            padding: 0 !important;
                            width: 100% !important;
                            max-width: none !important;
                        }
                        body * { visibility: hidden; }
                        .invoice-container, .invoice-container * { visibility: visible; }
                        .invoice-container { position: absolute; left: 0; top: 0; }
                    }
                `}
            </style>
            <div className="invoice-container animate-fade" style={{
                width: '100%',
                maxWidth: '560px',
                backgroundColor: '#ffffff',
                color: '#111111',
                padding: '40px 48px',
                borderRadius: '16px',
                position: 'relative',
                boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
                maxHeight: '90vh',
                overflowY: 'auto'
            }}>
                <button
                    onClick={onClose}
                    className="no-print"
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
                    <h1 style={{ fontSize: '1.8rem', marginBottom: '4px', letterSpacing: '-0.03em', fontWeight: '700' }}>snackssmania</h1>
                    <p style={{ color: '#888', fontSize: '0.85rem', letterSpacing: '0.05em' }}>PREMIUM DINING</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', borderBottom: '1px solid #eaeaea', paddingBottom: '24px' }}>
                    <div>
                        <div className="no-print" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500', marginBottom: '4px' }}>
                            {order.table_id === 0 ? 'TAKEAWAY ORDER' : `TABLE ${order.table_id}`}
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                            {(() => {
                                if (order.table_id === 0) {
                                    const meta = order.items.find(i => i.type === 'METADATA');
                                    return meta ? `Order #TK-${meta.takeaway_no}` : `Order #${order.id}`;
                                }
                                return `Table ${order.table_id}`;
                            })()}
                        </h2>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.9rem', color: '#555' }}>
                        <p style={{ marginBottom: '4px' }}><strong>INV:</strong> {invoiceNumber}</p>
                        <p style={{ marginBottom: '4px' }}><strong>ORD:</strong> {orderNumber}</p>
                        <p><strong>DATE:</strong> {new Date(order.created_at || Date.now()).toLocaleDateString()}</p>
                    </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px' }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '12px 0', borderBottom: '2px solid #111', fontSize: '0.85rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Item</th>
                            <th style={{ textAlign: 'center', padding: '12px 0', borderBottom: '2px solid #111', fontSize: '0.85rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Qty</th>
                            <th style={{ textAlign: 'right', padding: '12px 0', borderBottom: '2px solid #111', fontSize: '0.85rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price</th>
                            <th style={{ textAlign: 'right', padding: '12px 0', borderBottom: '2px solid #111', fontSize: '0.85rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.filter(i => i.type !== 'METADATA').map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #eaeaea' }}>
                                <td style={{ padding: '16px 0', fontWeight: '500' }}>{item.name}</td>
                                <td style={{ textAlign: 'center', padding: '16px 0', color: '#666' }}>{item.qty}</td>
                                <td style={{ textAlign: 'right', padding: '16px 0', color: '#666' }}>₹{item.price}</td>
                                <td style={{ textAlign: 'right', padding: '16px 0', fontWeight: '600' }}>₹{item.price * item.qty}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
                    <div>
                        <p style={{ color: '#888', fontSize: '0.8rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Mode</p>
                        <div className="no-print" style={{ display: 'flex', gap: '8px' }}>
                            {['Cash', 'Online'].map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => setPaymentMethod(mode)}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        border: paymentMethod === mode ? '1px solid #111' : '1px solid #eaeaea',
                                        backgroundColor: paymentMethod === mode ? '#111' : '#fff',
                                        color: paymentMethod === mode ? '#fff' : '#111',
                                        fontSize: '0.85rem',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                        <p style={{ fontSize: '1rem', fontWeight: '600', color: '#111', marginTop: '4px' }}>{paymentMethod}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '24px', color: '#666', fontSize: '0.95rem' }}>
                            <span>Subtotal</span>
                            <span>₹{order.total}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '24px', fontWeight: '700', fontSize: '1.4rem', borderTop: '2px solid #111', paddingTop: '8px', letterSpacing: '-0.02em' }}>
                            <span>Total</span>
                            <span>₹{order.total}</span>
                        </div>
                    </div>
                </div>

                <div className="no-print" style={{ marginTop: '48px', display: 'flex', gap: '16px' }}>
                    <button
                        onClick={onClose}
                        style={{ flex: 1, padding: '16px', backgroundColor: '#f5f5f5', color: '#111', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem' }}
                    >
                        Close
                    </button>
                    <button
                        onClick={handlePrint}
                        style={{ flex: 2, padding: '16px', backgroundColor: '#111', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem' }}
                    >
                        Print Receipt
                    </button>
                </div>

                <div style={{ marginTop: '40px', textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>
                    <p>Thank you for dining with us!</p>
                </div>
            </div>
        </div>
    );
};

export default InvoiceModal;
