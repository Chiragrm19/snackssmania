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
                        position: 'relative',
                        aspectRatio: '2/3',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                        overflow: 'hidden',
                        backgroundColor: 'black'
                    }}>
                        <img src="/qr-template.jpg" style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'fill',
                            zIndex: 0
                        }} alt="template background" />

                        <div style={{
                            position: 'absolute',
                            top: '23.5%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '61%',
                            height: '40.66%',
                            backgroundColor: '#ffffff',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '12px',
                            zIndex: 1
                        }}>
                            <QRCodeSVG
                                value={`${qrBaseUrl.replace(/\/$/, '')}/menu?table=${table.id}`}
                                size={256}
                                style={{ width: '100%', height: '100%' }}
                                level="H"
                                fgColor="#000000"
                                includeMargin={false}
                            />
                            <div style={{ fontSize: '0.8rem', fontWeight: '900', color: '#000', marginTop: '6px', textAlign: 'center', fontFamily: 'sans-serif' }}>
                                {table.id === 0 ? 'PARCEL' : `TABLE ${table.id}`}
                            </div>
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
                    }
                    #bulk-qr-container { 
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        overflow: visible !important;
                        display: flex !important;
                        flex-wrap: wrap !important;
                        justify-content: center !important;
                        gap: 10mm !important;
                    }
                    .qr-card-premium { 
                        page-break-inside: avoid !important;
                        margin: 0 !important;
                        width: 90mm !important;
                        height: 135mm !important;
                        box-shadow: none !important;
                        border: none !important;
                        print-color-adjust: exact !important;
                        -webkit-print-color-adjust: exact !important;
                        display: block !important;
                        position: relative !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default BulkQRModal;
