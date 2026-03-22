import React from 'react';

const CartBar = ({ count, total, onPlaceOrder, loading }) => {
    if (count === 0) return null;

    return (
        <div className="cart-bar animate-slide-up" style={{
            position: 'fixed',
            bottom: '32px',
            left: '0',
            right: '0',
            margin: '0 auto',
            width: 'calc(100% - 48px)',
            maxWidth: '380px',
            background: 'var(--bg-surface)',
            borderRadius: '24px',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px var(--border-subtle)',
            zIndex: 1000,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxSizing: 'border-box'
        }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.05em' }}>
                    {count} {count === 1 ? 'ITEM' : 'ITEMS'}
                </span>
                <span style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                    ₹{total}
                </span>
            </div>

            <button
                onClick={onPlaceOrder}
                disabled={loading}
                style={{
                    backgroundColor: 'var(--accent-white)',
                    color: 'var(--bg-dark)',
                    padding: '12px 24px',
                    borderRadius: '16px',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    letterSpacing: '-0.01em',
                    boxShadow: '0 4px 14px rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                }}
            >
                {loading ? 'PROCESSING...' : 'ORDER NOW →'}
            </button>
        </div>
    );
};

export default CartBar;