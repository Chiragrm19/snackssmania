import React from 'react';

const CartBar = ({ count, total, onPlaceOrder, loading }) => {
    if (count === 0) return null;

    return (
        <div className="cart-footer animate-pop">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                    <span style={{
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                        fontWeight: '700',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                    }}>
                        {count} {count === 1 ? 'item' : 'items'} in cart
                    </span>
                    <span style={{
                        fontSize: '1.5rem',
                        fontWeight: '800',
                        letterSpacing: '-0.04em',
                        background: 'linear-gradient(135deg, #fff 0%, #c8c8e8 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        lineHeight: 1,
                    }}>
                        ₹{total}
                    </span>
                </div>

                <button
                    onClick={onPlaceOrder}
                    disabled={loading}
                    className="btn-primary"
                    style={{
                        padding: '14px 28px',
                        borderRadius: '20px',
                        fontWeight: '800',
                        fontSize: '0.95rem',
                        letterSpacing: '-0.01em',
                        flexShrink: 0,
                        opacity: loading ? 0.65 : 1,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}
                >
                    {loading ? (
                        <>
                            <span
                                className="animate-spin"
                                style={{ display: 'inline-block', fontSize: '0.9rem' }}
                            >⟳</span>
                            Placing…
                        </>
                    ) : (
                        <>Order Now →</>
                    )}
                </button>
            </div>
        </div>
    );
};

export default CartBar;