import React, { useState } from 'react';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).substr(2, 9);
const fmtTime = (ts) => new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

function stockStatus(m) {
    if (!m) return 'ok';
    if (m.stock <= 0) return 'out';
    if (m.stock <= m.minThreshold) return 'low';
    return 'ok';
}

const STATUS = {
    ok:  { label: 'Sufficient',   bg: 'rgba(74,222,128,0.15)',  color: '#4ade80', border: 'rgba(74,222,128,0.3)' },
    low: { label: 'Low Stock',    bg: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: 'rgba(251,191,36,0.35)' },
    out: { label: 'Out of Stock', bg: 'rgba(248,113,113,0.15)', color: '#f87171', border: 'rgba(248,113,113,0.35)' },
};

// ─── STYLES (MATCH ADMIN 3D) ──────────────────────────────────────────────────
const glassStyle = {
    background: 'var(--glass)',
    border: '1px solid var(--border-subtle)',
    backdropFilter: 'blur(24px)',
};
const inputStyle = {
    width: '100%',
    padding: '14px 18px',
    borderRadius: '16px',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-main)',
    outline: 'none',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
};
const labelStyle = {
    display: 'block',
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
    marginBottom: '8px',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
};
const btnPrimary = {
    padding: '12px 24px',
    background: 'var(--accent-white)',
    color: 'var(--bg-dark)',
    border: 'none',
    borderRadius: '14px',
    fontWeight: '700',
    fontSize: '0.88rem',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
};
const btnSecondary = {
    padding: '10px 16px',
    background: 'var(--glass)',
    color: 'var(--text-main)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '12px',
    fontWeight: '600',
    fontSize: '0.82rem',
    cursor: 'pointer',
};
const btnDanger = {
    padding: '10px 14px',
    background: 'rgba(248,113,113,0.1)',
    color: '#f87171',
    border: '1px solid rgba(248,113,113,0.2)',
    borderRadius: '12px',
    fontWeight: '600',
    fontSize: '0.82rem',
    cursor: 'pointer',
};

// ─── MODAL COMPONENT ──────────────────────────────────────────────────────────
function InvModal({ title, onClose, children }) {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 3000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)',
        }} onClick={onClose}>
            <div className="glass animate-pop" style={{
                borderRadius: '24px', width: '100%', maxWidth: '480px',
                maxHeight: '85vh', overflowY: 'auto',
                background: 'var(--bg-surface)',
                boxShadow: 'var(--shadow-float)',
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>{title}</h3>
                    <button onClick={onClose} style={{ ...btnSecondary, padding: '8px 14px' }}>✕</button>
                </div>
                <div style={{ padding: '24px' }}>{children}</div>
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    const s = STATUS[status] || STATUS.ok;
    return (
        <span style={{
            padding: '5px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '800',
            background: s.bg, color: s.color, border: `1px solid ${s.border}`,
            textTransform: 'uppercase', letterSpacing: '0.04em'
        }}>{s.label}</span>
    );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const InventoryManager = ({ materials, setMaterials, recipes, setRecipes, consumeLog, setConsumeLog, restockLog, setRestockLog, menuItems }) => {
    const [subTab, setSubTab] = useState('dashboard');
    const [modal, setModal] = useState(null);
    const [editTarget, setEdit] = useState(null);

    // ── Computed Highlights ──
    const lowCount = materials.filter(m => stockStatus(m) === 'low').length;
    const outCount = materials.filter(m => stockStatus(m) === 'out').length;
    const actFeed = [...consumeLog, ...restockLog].sort((a, b) => b.time - a.time).slice(0, 10);

    // ── Handlers ──
    const saveMaterial = (data) => {
        const parsed = { ...data, stock: Number(data.stock), minThreshold: Number(data.minThreshold), costPerUnit: Number(data.costPerUnit) };
        if (editTarget) {
            setMaterials(p => p.map(m => m.id === editTarget.id ? { ...editTarget, ...parsed } : m));
        } else {
            setMaterials(p => [...p, { id: uid(), ...parsed }]);
        }
        setModal(null); setEdit(null);
    };

    const deleteMaterial = (id) => {
        if (window.confirm('Delete this material?')) setMaterials(p => p.filter(m => m.id !== id));
    };

    const saveRecipe = (data) => {
        if (editTarget) {
            setRecipes(p => p.map(r => r.id === editTarget.id ? { ...editTarget, ...data } : r));
        } else {
            setRecipes(p => [...p, { id: uid(), ...data }]);
        }
        setModal(null); setEdit(null);
    };

    const deleteRecipe = (id) => {
        if (window.confirm('Delete this recipe?')) setRecipes(p => p.filter(r => r.id !== id));
    };

    const onRestock = (materialId, qty) => {
        const mat = materials.find(m => m.id === materialId);
        if (!mat) return;
        setMaterials(p => p.map(m => m.id === materialId ? { ...m, stock: m.stock + Number(qty) } : m));
        setRestockLog(p => [{ id: uid(), time: Date.now(), materialName: mat.name, unit: mat.unit, qty: Number(qty) }, ...p]);
        setModal(null);
    };

    return (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
            {/* Sub Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
                {[
                    { id: 'dashboard', label: '📊 Overview' },
                    { id: 'materials', label: '📦 Materials' },
                    { id: 'recipes',   label: '🍽️ Recipes' },
                    { id: 'history',   label: '🕒 History' },
                ].map(t => (
                    <button key={t.id} onClick={() => setSubTab(t.id)} style={{
                        padding: '10px 20px', borderRadius: '14px', fontWeight: '700', fontSize: '0.85rem',
                        whiteSpace: 'nowrap', border: 'none', transition: 'all 0.3s',
                        background: subTab === t.id ? 'var(--accent-white)' : 'var(--glass)',
                        color: subTab === t.id ? 'var(--bg-dark)' : 'var(--text-muted)',
                        boxShadow: subTab === t.id ? 'var(--shadow-md)' : 'none',
                    }}>{t.label}</button>
                ))}
            </div>

            {/* DASHBOARD */}
            {subTab === 'dashboard' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px' }}>
                        {[
                            { label: 'Total Stocked', val: materials.length, c: 'var(--text-main)' },
                            { label: 'Low Alert',     val: lowCount,         c: '#fbbf24' },
                            { label: 'Out of Stock',  val: outCount,         c: '#f87171' },
                            { label: 'Menu Recipes',  val: recipes.length,   c: '#4ade80' },
                        ].map(s => (
                            <div key={s.label} className="glass" style={{ padding: '24px', borderRadius: '24px', textAlign: 'center' }}>
                                <div style={{ fontSize: '2.4rem', fontWeight: '900', color: s.c, letterSpacing: '-0.04em' }}>{s.val}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '800', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                        {/* Alerts Card */}
                        <div className="glass" style={{ padding: '28px', borderRadius: '24px' }}>
                            <h3 style={{ color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: '800', marginBottom: '20px', letterSpacing: '-0.02em' }}>⚠️ Stock Notifications</h3>
                            {(lowCount + outCount) === 0 ? (
                                <div style={{ padding: '32px 0', textAlign: 'center', opacity: 0.5 }}>✨ All materials sufficient</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {materials.filter(m => stockStatus(m) !== 'ok').map(m => (
                                        <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
                                            <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{m.name}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={{ color: 'var(--text-faint)', fontSize: '0.8rem' }}>{m.stock}{m.unit}</span>
                                                <StatusBadge status={stockStatus(m)} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Activity Card */}
                        <div className="glass" style={{ padding: '28px', borderRadius: '24px' }}>
                            <h3 style={{ color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: '800', marginBottom: '20px', letterSpacing: '-0.02em' }}>🕐 Recent Inventory Activity</h3>
                            {actFeed.length === 0 ? (
                                <div style={{ padding: '32px 0', textAlign: 'center', opacity: 0.5 }}>No logs yet.</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {actFeed.map(a => (
                                        <div key={a.id} style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
                                            <span style={{ fontSize: '1.2rem' }}>{a.recipeName ? '📉' : '📈'}</span>
                                            <div>
                                                <p style={{ fontWeight: '700', fontSize: '0.88rem', color: 'var(--text-main)' }}>{a.recipeName ? `Used for ${a.recipeName}` : `Restocked ${a.materialName}`}</p>
                                                <p style={{ color: 'var(--text-faint)', fontSize: '0.75rem', marginTop: '2px' }}>{a.qty}{a.unit || ''} · {fmtTime(a.time)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MATERIALS TAB */}
            {subTab === 'materials' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-main)' }}>Raw Materials</h2>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button style={btnSecondary} onClick={() => setModal('restock')}>Restock</button>
                            <button style={btnPrimary} onClick={() => { setEdit(null); setModal('material'); }}>+ New</button>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                        {materials.map(m => (
                            <div key={m.id} className="glass" style={{ padding: '20px', borderRadius: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                                    <div>
                                        <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-main)' }}>{m.name}</div>
                                        <div style={{ color: 'var(--text-faint)', fontSize: '0.75rem', marginTop: '2px' }}>Cost: ₹{m.costPerUnit}/{m.unit}</div>
                                    </div>
                                    <StatusBadge status={stockStatus(m)} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--text-main)' }}>{m.stock} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.unit}</span></div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)', fontWeight: '700' }}>THRESHOLD: {m.minThreshold}{m.unit}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button style={{ ...btnSecondary, padding: '8px 12px' }} onClick={() => { setEdit(m); setModal('material'); }}>Edit</button>
                                        <button style={{ ...btnDanger, padding: '8px 10px' }} onClick={() => deleteMaterial(m.id)}>✕</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* RECIPES TAB */}
            {subTab === 'recipes' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-main)' }}>Menu Recipes</h2>
                        <button style={btnPrimary} onClick={() => { setEdit(null); setModal('recipe'); }}>+ Create Recipe</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                        {recipes.map(r => (
                            <div key={r.id} className="glass" style={{ padding: '24px', borderRadius: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h4 style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-main)' }}>{r.name}</h4>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button style={{ ...btnSecondary, padding: '6px 12px' }} onClick={() => { setEdit(r); setModal('recipe'); }}>Edit</button>
                                        <button style={{ ...btnDanger, padding: '6px 10px' }} onClick={() => deleteRecipe(r.id)}>✕</button>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {r.recipe.map((ing, i) => {
                                        const mat = materials.find(m => m.id === ing.materialId);
                                        return (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
                                                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>{mat?.name || 'Deleted'}</span>
                                                <span style={{ color: 'var(--text-main)', fontWeight: '800' }}>{ing.qty}{mat?.unit}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* HISTORY TAB */}
            {subTab === 'history' && (
                <div className="glass" style={{ borderRadius: '24px', overflow: 'hidden' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.2)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '800' }}>Consumption Logs</h3>
                    </div>
                    <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '10px' }}>
                        {consumeLog.map(l => (
                            <div key={l.id} style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{l.recipeName}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginTop: '4px' }}>{fmtTime(l.time)}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ color: '#f87171', fontWeight: '800', fontSize: '0.9rem' }}>− Deducted</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{l.deducted.map(d => `${d.qty}${d.unit}`).join(', ')}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── MODALS ─────────────────────────────────────────── */}
            {modal === 'material' && (
                <MaterialModal initial={editTarget} onSave={saveMaterial} onClose={() => setModal(null)} />
            )}
            {modal === 'recipe' && (
                <RecipeModal initial={editTarget} materials={materials} menuItems={menuItems} onSave={saveRecipe} onClose={() => setModal(null)} />
            )}
            {modal === 'restock' && (
                <RestockModal materials={materials} onRestock={onRestock} onClose={() => setModal(null)} />
            )}
        </div>
    );
};

function MaterialModal({ initial, onSave, onClose }) {
    const [form, setForm] = useState(initial || { name: '', unit: 'g', stock: '', minThreshold: '', costPerUnit: '' });
    return (
        <InvModal title={initial ? 'Edit Material' : 'Add Material'} onClose={onClose}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div><label style={labelStyle}>Material Name</label><input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Coffee Beans" /></div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}><label style={labelStyle}>Unit</label><select style={inputStyle} value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>{['g','kg','ml','L','pcs'].map(u => <option key={u} value={u} style={{color:'black'}}>{u}</option>)}</select></div>
                    <div style={{ flex: 1 }}><label style={labelStyle}>Cost / Unit (₹)</label><input type="number" style={inputStyle} value={form.costPerUnit} onChange={e => setForm({ ...form, costPerUnit: e.target.value })} placeholder="0.00" /></div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}><label style={labelStyle}>Current Stock</label><input type="number" style={inputStyle} value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="0" /></div>
                    <div style={{ flex: 1 }}><label style={labelStyle}>Alert Threshold</label><input type="number" style={inputStyle} value={form.minThreshold} onChange={e => setForm({ ...form, minThreshold: e.target.value })} placeholder="0" /></div>
                </div>
                <button style={{ ...btnPrimary, width: '100%', padding: '16px' }} onClick={() => form.name && onSave(form)}>Save Material</button>
            </div>
        </InvModal>
    );
}

function RecipeModal({ initial, materials, menuItems, onSave, onClose }) {
    const [name, setName] = useState(initial?.name || '');
    const [menuItemId, setMenuItemId] = useState(initial?.menuItemId || '');
    const [recipe, setRecipe] = useState(initial?.recipe || []);

    const addIng = () => setRecipe([...recipe, { materialId: materials[0]?.id, qty: 1 }]);
    const updateIng = (i, f, v) => setRecipe(recipe.map((r, idx) => idx === i ? { ...r, [f]: f === 'qty' ? Number(v) : v } : r));

    return (
        <InvModal title={initial ? 'Edit Recipe' : 'New Recipe'} onClose={onClose}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={labelStyle}>Link to Menu Item</label>
                    <select style={inputStyle} value={menuItemId} onChange={e => {
                        const item = menuItems.find(m => String(m.id) === String(e.target.value));
                        setMenuItemId(e.target.value);
                        if (item) setName(item.name);
                    }}>
                        <option value="">Select Menu Item...</option>
                        {menuItems.map(m => <option key={m.id} value={m.id} style={{color:'black'}}>{m.emoji} {m.name}</option>)}
                    </select>
                </div>
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <label style={{ ...labelStyle, marginBottom: 0 }}>Ingredients per Plate/Cup</label>
                        <button style={{ ...btnSecondary, padding: '6px 12px' }} onClick={addIng}>+ Add</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {recipe.map((r, i) => (
                            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                                <select style={{ ...inputStyle, flex: 1, padding: '8px 12px' }} value={r.materialId} onChange={e => updateIng(i, 'materialId', e.target.value)}>
                                    {materials.map(m => <option key={m.id} value={m.id} style={{color:'black'}}>{m.name}</option>)}
                                </select>
                                <input type="number" style={{ ...inputStyle, width: '80px', padding: '8px 12px' }} value={r.qty} onChange={e => updateIng(i, 'qty', e.target.value)} />
                                <button onClick={() => setRecipe(recipe.filter((_, idx) => idx !== i))} style={btnDanger}>✕</button>
                            </div>
                        ))}
                    </div>
                </div>
                <button style={{ ...btnPrimary, width: '100%', padding: '16px' }} onClick={() => (name || menuItemId) && onSave({ name, menuItemId, recipe })}>Confirm Recipe</button>
            </div>
        </InvModal>
    );
}

function RestockModal({ materials, onRestock, onClose }) {
    const [id, setId] = useState(materials[0]?.id || '');
    const [qty, setQty] = useState('');
    return (
        <InvModal title="Restock Materials" onClose={onClose}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div><label style={labelStyle}>Material</label><select style={inputStyle} value={id} onChange={e => setId(e.target.value)}>{materials.map(m => <option key={m.id} value={m.id} style={{color:'black'}}>{m.name} ({m.stock}{m.unit})</option>)}</select></div>
                <div><label style={labelStyle}>Qty to Add</label><input type="number" style={inputStyle} value={qty} onChange={e => setQty(e.target.value)} placeholder="0" /></div>
                <button style={{ ...btnPrimary, width: '100%', padding: '16px' }} onClick={() => id && qty > 0 && onRestock(id, qty)}>Update Stock</button>
            </div>
        </InvModal>
    );
}

export default InventoryManager;
