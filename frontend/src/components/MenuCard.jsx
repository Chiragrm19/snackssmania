import React from 'react';

const getHueFromString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % 360);
};

const MenuCard = ({ item, cartQuantity, onAdd, onRemove }) => {
    const isSelected = cartQuantity > 0;
    const hue = getHueFromString(item.name + (item.emoji || ''));

    return (
        <div
            className={`menu-item-card animate-fade ${isSelected ? 'in-cart' : ''}`}
            style={{
                background: isSelected
                    ? `linear-gradient(155deg, hsla(${hue}, 60%, 40%, 0.18) 0%, rgba(255,255,255,0.03) 100%)`
                    : undefined,
                borderColor: isSelected ? `hsla(${hue}, 60%, 50%, 0.30)` : undefined,
                borderTopColor: isSelected ? `hsla(${hue}, 60%, 60%, 0.55)` : undefined,
                opacity: item.is_available === false ? 0.6 : 1,
                filter: item.is_available === false ? 'grayscale(0.5)' : 'none',
                boxShadow: isSelected
                    ? `0 6px 24px rgba(0,0,0,0.7), 0 0 30px hsla(${hue}, 60%, 50%, 0.12), inset 0 1px 0 hsla(${hue}, 80%, 70%, 0.2)`
                    : undefined,
                display: 'flex',
                flexDirection: 'column',
                gap: '0',
                pointerEvents: item.is_available === false ? 'none' : 'auto'
            }}
        >
            {/* Emoji / Image Section */}
            <div style={{
                background: `linear-gradient(155deg, hsla(${hue}, 50%, 50%, ${isSelected ? 0.22 : 0.08}), rgba(0,0,0,0.3))`,
                height: '140px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '52px',
                position: 'relative',
                borderRadius: '12px 12px 0 0',
                overflow: 'hidden',
                marginTop: '-12px',
                marginLeft: '-16px',
                marginRight: '-16px',
                marginBottom: '16px',
                transition: 'background 0.3s ease',
            }}>
                {/* Top shimmer line on area */}
                <div style={{
                    position: 'absolute',
                    top: 0, left: 20, right: 20,
                    height: '1px',
                    background: `linear-gradient(90deg, transparent, hsla(${hue}, 80%, 70%, 0.5), transparent)`
                }} />

                {item.image_url ? (
                    <img 
                        src={item.image_url} 
                        alt={item.name} 
                        style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover',
                            filter: isSelected ? 'brightness(1.1) contrast(1.1)' : 'none',
                            transition: 'all 0.5s ease',
                            transform: isSelected ? 'scale(1.1)' : 'scale(1)'
                        }} 
                    />
                ) : (
                    <span style={{
                        filter: isSelected ? `drop-shadow(0 4px 12px hsla(${hue}, 80%, 60%, 0.6))` : 'none',
                        transition: 'filter 0.3s ease',
                        transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                        display: 'inline-block',
                        transition: 'all 0.3s cubic-bezier(0.19,1,0.22,1)',
                    }}>
                        🍽️
                    </span>
                )}

                {/* Availability Overlay */}
                {item.is_available === false && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
                         <span style={{ backgroundColor: 'rgba(0,0,0,0.8)', color: 'white', padding: '6px 14px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.05em' }}>UNAVAILABLE</span>
                    </div>
                )}

                {/* SIGNATURE badge */}
                {item.is_signature && (
                    <div style={{
                        position: 'absolute',
                        top: '10px',
                        left: '12px',
                        padding: '3px 9px',
                        borderRadius: '20px',
                        background: 'linear-gradient(135deg, #fff 0%, #ddd 100%)',
                        color: '#050507',
                        fontSize: '0.6rem',
                        fontWeight: '800',
                        letterSpacing: '0.06em',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,1)',
                    }}>
                        ★ SIGNATURE
                    </div>
                )}

                {/* Veg/NonVeg dot */}
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '12px',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: item.is_veg ? '#4ade80' : '#f87171',
                    border: '1.5px solid rgba(255,255,255,0.3)',
                    boxShadow: item.is_veg ? '0 0 8px rgba(74,222,128,0.6)' : '0 0 8px rgba(248,113,113,0.6)',
                }} />
            </div>

            {/* Body */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: 'var(--text-main)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.3,
                }}>
                    {item.name}
                </h3>
                <p style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: '32px',
                }}>
                    {item.description}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    {/* Price */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        {item.discount_pct > 0 && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)', textDecoration: 'line-through' }}>
                                ₹{item.price}
                            </span>
                        )}
                        <span style={{
                            fontWeight: '800',
                            fontSize: '1.15rem',
                            letterSpacing: '-0.03em',
                            background: isSelected
                                ? `linear-gradient(135deg, hsla(${hue}, 80%, 70%, 1), hsla(${hue}, 60%, 55%, 1))`
                                : 'linear-gradient(135deg, #fff, #bbb)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            transition: 'all 0.3s ease',
                        }}>
                            ₹{item.discount_pct > 0
                                ? Math.round(item.price * (1 - item.discount_pct / 100))
                                : item.price}
                        </span>
                    </div>

                    {/* Cart controls */}
                    {cartQuantity > 0 ? (
                        <div className="qty-control">
                            <button
                                className="qty-btn"
                                onClick={() => onRemove(item.id)}
                                aria-label="Remove one"
                            >−</button>
                            <span style={{
                                fontWeight: '800',
                                width: '22px',
                                textAlign: 'center',
                                fontSize: '0.95rem',
                                color: 'var(--text-main)',
                            }}>
                                {cartQuantity}
                            </span>
                            <button
                                className="qty-btn"
                                onClick={() => onAdd(item)}
                                aria-label="Add one"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.10) 100%)',
                                    color: '#fff',
                                }}
                            >+</button>
                        </div>
                    ) : (
                        <button
                            onClick={() => onAdd(item)}
                            disabled={item.is_available === false}
                            style={{
                                padding: '7px 18px',
                                background: item.is_available === false ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)',
                                border: '1px solid rgba(255,255,255,0.14)',
                                borderTopColor: 'rgba(255,255,255,0.24)',
                                color: item.is_available === false ? 'var(--text-faint)' : 'var(--text-main)',
                                fontWeight: '700',
                                fontSize: '0.88rem',
                                borderRadius: '20px',
                                boxShadow: item.is_available === false ? 'none' : '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
                                letterSpacing: '-0.01em',
                            }}
                        >
                            {item.is_available === false ? 'Sold Out' : '+ Add'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MenuCard;
