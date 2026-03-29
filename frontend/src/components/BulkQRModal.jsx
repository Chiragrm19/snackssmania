import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const BulkQRModal = ({ tables, isOpen, onClose, qrBaseUrl }) => {
    if (!isOpen) return null;

    const printBulk = () => {
        window.print();
    };

    return (
        <div className="no-print" style={{ 
            position: 'fixed', inset: 0, zIndex: 5000, 
            background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)',
            display: 'flex', flexDirection: 'column', padding: '40px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                <div>
                    <h2 style={{ color: 'var(--text-main)', fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.02em' }}>Bulk QR Printing</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Premium table cards optimized for bulk printing.</p>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <button 
                        onClick={printBulk} 
                        style={{ padding: '16px 32px', background: 'var(--accent-white)', color: 'var(--bg-dark)', borderRadius: '16px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 8px 24px rgba(255,255,255,0.2)' }}
                    >Print All Cards</button>
                    <button 
                        onClick={onClose} 
                        style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.1)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', borderRadius: '16px', fontWeight: '600', cursor: 'pointer' }}
                    >Close</button>
                </div>
            </div>

            <div id="bulk-qr-container" style={{ 
                flex: 1, overflowY: 'auto', 
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                gap: '40px', padding: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%' 
            }}>
                {tables.map(table => (
                    <div key={table.id} className="qr-card-premium" style={{
                        aspectRatio: '2/3',
                        background: '#111',
                        border: '2px solid #D4AF37', // Gold
                        borderRadius: '2px',
                        padding: '40px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        position: 'relative',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                        color: '#D4AF37',
                        textAlign: 'center',
                        fontFamily: "'Playfair Display', serif"
                    }}>
                        {/* Decorative Corners */}
                        <div style={{ position: 'absolute', top: '10px', left: '10px', width: '30px', height: '30px', borderTop: '2px solid #D4AF37', borderLeft: '2px solid #D4AF37' }}></div>
                        <div style={{ position: 'absolute', top: '10px', right: '10px', width: '30px', height: '30px', borderTop: '2px solid #D4AF37', borderRight: '2px solid #D4AF37' }}></div>
                        <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '30px', height: '30px', borderBottom: '2px solid #D4AF37', borderLeft: '2px solid #D4AF37' }}></div>
                        <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '30px', height: '30px', borderBottom: '2px solid #D4AF37', borderRight: '2px solid #D4AF37' }}></div>

                        <div style={{ fontSize: '1.8rem', fontWeight: '900', fontStyle: 'italic', letterSpacing: '2px' }}>SnackssMania</div>
                        
                        <div style={{ background: '#fff', padding: '15px', borderRadius: '4px', boxShadow: '0 0 20px rgba(212,175,55,0.3)' }}>
                            <QRCodeSVG
                                value={`${qrBaseUrl.replace(/\/$/, '')}/menu?table=${table.id}`}
                                size={180}
                                level="H"
                                fgColor="#000000"
                            />
                        </div>

                        <div>
                            <div style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '8px' }}>Scan to Order</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: '900', borderTop: '1px solid #D4AF37', borderBottom: '1px solid #D4AF37', padding: '8px 20px', margin: '8px 0' }}>Table {table.id}</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '12px' }}>www.snackssmania.com</div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '20px' }}>Powered by Silovation Technologies</div>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; visibility: hidden !important; }
                    body { background: white !important; padding: 0 !important; margin: 0 !important; visibility: hidden !important; }
                    #bulk-qr-container, #bulk-qr-container * { 
                        visibility: visible !important; 
                        display: grid !important;
                    }
                    #bulk-qr-container { 
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        overflow: visible !important;
                    }
                    .qr-card-premium { 
                        page-break-inside: avoid !important;
                        margin: 10mm auto !important;
                        width: 90mm !important;
                        height: 140mm !important;
                        box-shadow: none !important;
                        border: 2px solid #D4AF37 !important;
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                }
            `}</style>
        </div>
    );
};

export default BulkQRModal;
