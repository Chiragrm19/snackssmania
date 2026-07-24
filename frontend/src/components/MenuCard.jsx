import React from 'react';

const MenuCard = ({ item, cartQuantity, onAdd, onRemove }) => {
    const isSelected = cartQuantity > 0;
    const isAvailable = item.is_available !== false;
    const discountedPrice = item.discount_pct > 0
        ? Math.round(item.price * (1 - item.discount_pct / 100))
        : item.price;

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                padding: '18px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: isSelected
                    ? 'linear-gradient(90deg, rgba(167,139,250,0.07) 0%, transparent 100%)'
                    : 'transparent',
                transition: 'background 0.2s ease',
                opacity: isAvailable ? 1 : 0.5,
                position: 'relative',
            }}
        >
            {/* LEFT: All text info */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>

                {/* Veg dot + badges row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Veg/Non-Veg Indicator (FSSAI style box) */}
                    <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '3px',
                        border: item.is_veg ? '1.5px solid #4ade80' : '1.5px solid #f87171',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: item.is_veg ? '#4ade80' : '#f87171',
                        }} />
                    </div>

                    {/* Bestseller badge */}
                    {item.is_signature && (
                        <span style={{
                            padding: '2px 7px',
                            borderRadius: '4px',
                            background: 'rgba(251,191,36,0.12)',
                            color: '#fbbf24',
                            fontSize: '0.6rem',
                            fontWeight: '800',
                            letterSpacing: '0.06em',
                            border: '1px solid rgba(251,191,36,0.25)',
                            textTransform: 'uppercase',
                        }}>
                            ★ Bestseller
                        </span>
                    )}

                    {/* Sold Out badge */}
                    {!isAvailable && (
                        <span style={{
                            padding: '2px 7px',
                            borderRadius: '4px',
                            background: 'rgba(239,68,68,0.12)',
                            color: '#f87171',
                            fontSize: '0.6rem',
                            fontWeight: '800',
                            letterSpacing: '0.06em',
                            border: '1px solid rgba(239,68,68,0.25)',
                        }}>
                            SOLD OUT
                        </span>
                    )}

                    {/* Discount badge */}
                    {item.discount_pct > 0 && (
                        <span style={{
                            padding: '2px 7px',
                            borderRadius: '4px',
                            background: 'rgba(52,211,153,0.12)',
                            color: '#34d399',
                            fontSize: '0.6rem',
                            fontWeight: '800',
                            border: '1px solid rgba(52,211,153,0.25)',
                        }}>
                            {item.discount_pct}% OFF
                        </span>
                    )}
                </div>

                {/* Item Name */}
                <h3 style={{
                    margin: 0,
                    fontSize: '0.97rem',
                    fontWeight: '700',
                    color: 'var(--text-main)',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.3,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}>
                    {item.emoji && <span style={{ marginRight: '6px', fontSize: '1rem' }}>{item.emoji}</span>}
                    {item.name}
                </h3>

                {/* Description */}
                {item.description && (
                    <p style={{
                        margin: 0,
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)',
                        lineHeight: 1.45,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        fontWeight: '400',
                        maxWidth: '90%',
                    }}>
                        {item.description}
                    </p>
                )}

                {/* Price */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                    <span style={{
                        fontWeight: '800',
                        fontSize: '1rem',
                        color: 'var(--text-main)',
                        letterSpacing: '-0.02em',
                    }}>
                        ₹{discountedPrice}
                    </span>
                    {item.discount_pct > 0 && (
                        <span style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-faint)',
                            textDecoration: 'line-through',
                        }}>
                            ₹{item.price}
                        </span>
                    )}
                </div>
            </div>

            {/* RIGHT: Add / Qty Controls */}
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                {cartQuantity > 0 ? (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        border: '1.5px solid rgba(167,139,250,0.5)',
                        borderRadius: '10px',
                        padding: '4px 10px',
                        background: 'rgba(167,139,250,0.1)',
                        minWidth: '88px',
                        justifyContent: 'space-between',
                    }}>
                        <button
                            onClick={() => onRemove(item.id)}
                            aria-label="Remove one"
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#a78bfa',
                                fontSize: '1.15rem',
                                cursor: 'pointer',
                                fontWeight: '700',
                                padding: '0',
                                lineHeight: 1,
                            }}
                        >−</button>
                        <span style={{
                            fontWeight: '800',
                            fontSize: '0.9rem',
                            color: '#a78bfa',
                            minWidth: '14px',
                            textAlign: 'center',
                        }}>
                            {cartQuantity}
                        </span>
                        <button
                            onClick={() => onAdd(item)}
                            aria-label="Add one"
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#a78bfa',
                                fontSize: '1.15rem',
                                cursor: 'pointer',
                                fontWeight: '700',
                                padding: '0',
                                lineHeight: 1,
                            }}
                        >+</button>
                    </div>
                ) : (
                    <button
                        onClick={() => onAdd(item)}
                        disabled={!isAvailable}
                        style={{
                            padding: '7px 20px',
                            background: 'transparent',
                            border: '1.5px solid rgba(255,255,255,0.2)',
                            color: isAvailable ? 'var(--text-main)' : 'var(--text-faint)',
                            fontWeight: '700',
                            fontSize: '0.85rem',
                            borderRadius: '10px',
                            cursor: isAvailable ? 'pointer' : 'not-allowed',
                            transition: 'border-color 0.15s ease, background 0.15s ease',
                            letterSpacing: '0.01em',
                            minWidth: '72px',
                            textAlign: 'center',
                        }}
                        onMouseEnter={e => {
                            if (isAvailable) {
                                e.target.style.borderColor = 'rgba(167,139,250,0.6)';
                                e.target.style.background = 'rgba(167,139,250,0.08)';
                                e.target.style.color = '#a78bfa';
                            }
                        }}
                        onMouseLeave={e => {
                            e.target.style.borderColor = 'rgba(255,255,255,0.2)';
                            e.target.style.background = 'transparent';
                            e.target.style.color = isAvailable ? 'var(--text-main)' : 'var(--text-faint)';
                        }}
                    >
                        {isAvailable ? '+ ADD' : 'N/A'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default MenuCard;
