import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const tables = [
    { id: 1, seats: 2 }, { id: 2, seats: 4 }, { id: 3, seats: 2 },
    { id: 4, seats: 6 }, { id: 5, seats: 4 }, { id: 6, seats: 2 },
    { id: 7, seats: 4 }, { id: 8, seats: 2 }, { id: 9, seats: 6 },
    { id: 10, seats: 4 }, { id: 11, seats: 2 }, { id: 12, seats: 4 }
];

const QRPage = () => {
    // Default to current origin, but allow override for mobile connectivity
    const [baseUrl, setBaseUrl] = React.useState(window.location.origin);
    const detectedIp = "10.18.40.43"; // From system research

    return (
        <div style={{ backgroundColor: 'var(--bg-dark)', minHeight: '100vh', padding: '48px 24px' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <header style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <h1 style={{ fontSize: '3.5rem', color: 'var(--text-main)', fontWeight: '700', letterSpacing: '-0.04em', lineHeight: '1.1' }}>
                        snackssmania
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', letterSpacing: '0.02em', marginBottom: '24px' }}>Scan to open the menu</p>
                    
                    <div className="glass" style={{ maxWidth: '600px', margin: '0 auto', padding: '24px', borderRadius: '24px', textAlign: 'left', border: '1px solid var(--border-subtle)' }}>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '12px', fontWeight: '600' }}>Mobile Connectivity Tip 📱</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.6' }}>
                            If you are scanning from a phone, your computer's <b>localhost</b> link won't work. 
                            Replace it with your computer's IP address (detected as <code>{detectedIp}</code>) below.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-faint)', fontWeight: '600', marginLeft: '4px' }}>Base URL (use your IP for mobile):</label>
                            <input 
                                type="text"
                                value={baseUrl}
                                onChange={(e) => setBaseUrl(e.target.value)}
                                placeholder={`http://${detectedIp}:5175`}
                                style={{ 
                                    width: '100%', 
                                    padding: '14px 18px', 
                                    backgroundColor: 'rgba(255,255,255,0.05)', 
                                    border: '1px solid var(--border-subtle)', 
                                    borderRadius: '12px', 
                                    color: 'var(--text-main)',
                                    fontSize: '0.95rem',
                                    outline: 'none',
                                    transition: 'border-color 0.3s ease'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--text-main)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
                            />
                        </div>
                    </div>
                </header>

                <div style={{
                    display: 'flex',
                    justifyContent: 'center'
                }}>
                    {tables.filter(t => t.id === 4).map((table) => {
                        const menuUrl = `${baseUrl.replace(/\/$/, '')}/menu?table=${table.id}`;

                        return (
                            <div key={table.id} className="glass animate-fade" style={{
                                padding: '40px',
                                borderRadius: '32px',
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '32px',
                                width: '100%',
                                maxWidth: '340px',
                                boxShadow: '0 24px 48px rgba(0,0,0,0.5)'
                            }}>
                                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h2 style={{ fontSize: '1.6rem', fontWeight: '600', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>Table {table.id}</h2>
                                    <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>{table.seats} seats</span>
                                </div>

                                <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '24px', lineHeight: 0, boxShadow: '0 8px 32px rgba(255,255,255,0.1)' }}>
                                    <QRCodeSVG
                                        value={menuUrl}
                                        size={220}
                                        bgColor="#ffffff"
                                        fgColor="#000000"
                                        level="H"
                                    />
                                </div>

                                <button
                                    onClick={() => window.open(menuUrl, '_blank')}
                                    style={{
                                        width: '100%',
                                        padding: '16px',
                                        backgroundColor: 'var(--accent-white)',
                                        color: 'var(--bg-dark)',
                                        fontWeight: '700',
                                        fontSize: '1.05rem',
                                        borderRadius: '16px',
                                        letterSpacing: '-0.01em'
                                    }}
                                >
                                    Open Web Menu
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default QRPage;
