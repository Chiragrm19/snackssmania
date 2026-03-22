import React from 'react';

// Generates a consistent hue based on a string (like the item name or emoji)
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
    
    // Default is a 'little grey' and more visible. When selected, it shows the colorful gradient.
    const cardStyle = {
        borderRadius: '20px',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        background: isSelected 
            ? `linear-gradient(135deg, hsla(${hue}, 60%, 40%, 0.3) 0%, rgba(255,255,255,0.08) 100%)` 
            : 'rgba(255, 255, 255, 0.06)',
        border: isSelected 
            ? `1px solid hsla(${hue}, 60%, 50%, 0.4)` 
            : '1px solid var(--glass-border)',
        boxShadow: isSelected 
            ? `0 8px 32px hsla(${hue}, 60%, 50%, 0.15)` 
            : '0 4px 24px rgba(0, 0, 0, 0.2)'
    };

    return (
        <div className="menu-card glass animate-fade" style={cardStyle}>
            <div className="card-top" style={{
                background: `linear-gradient(135deg, hsla(${hue}, 50%, 50%, ${isSelected ? 0.3 : 0.1}), rgba(255,255,255,0.01))`,
                height: '140px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '56px',
                position: 'relative',
                transition: 'all 0.3s ease'
            }}>
                {item.emoji}
                {item.is_signature && (
                    <div style={{
                        position: 'absolute',
                        top: '16px',
                        left: '16px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        backgroundColor: 'var(--accent-white)',
                        color: 'var(--bg-dark)',
                        fontSize: '0.65rem',
                        fontWeight: '700',
                        letterSpacing: '0.04em',
                        boxShadow: '0 4px 12px rgba(255, 255, 255, 0.2)'
                    }}>
                        SIGNATURE
                    </div>
                )}
                <div className="veg-indicator" style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: item.is_veg ? 'var(--text-main)' : 'var(--text-faint)',
                    border: '2px solid var(--glass-border)'
                }}></div>
            </div>

            <div className="card-body" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '6px', fontWeight: '600' }}>{item.name}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px', height: '40px', overflow: 'hidden' }}>
                    {item.description}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {item.discount_pct > 0 && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)', textDecoration: 'line-through' }}>
                                ₹{item.price}
                            </span>
                        )}
                        <span style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '1.2rem' }}>
                            ₹{item.discount_pct > 0 ? Math.round(item.price * (1 - item.discount_pct / 100)) : item.price}
                        </span>
                    </div>

                    {cartQuantity > 0 ? (
                        <div className="qty-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                                onClick={() => onRemove(item.id)}
                                style={{ width: '32px', height: '32px', backgroundColor: 'var(--glass-border)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}
                            >−</button>
                            <span style={{ fontWeight: '600', width: '20px', textAlign: 'center' }}>{cartQuantity}</span>
                            <button
                                onClick={() => onAdd(item)}
                                style={{ width: '32px', height: '32px', backgroundColor: 'var(--accent-white)', color: 'var(--bg-dark)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}
                            >+</button>
                        </div>
                    ) : (
                        <button
                            onClick={() => onAdd(item)}
                            style={{ padding: '8px 20px', backgroundColor: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', fontWeight: '600', borderRadius: '20px' }}
                        >
                            Add
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MenuCard;
