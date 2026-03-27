import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                alert('Signup successful! You can now log in.');
                setIsLogin(true);
            }
            if (isLogin) navigate('/admin');
        } catch (err) {
            let userMessage = err.message;
            if (err.message.toLowerCase().includes('email not confirmed')) {
                userMessage = "Email not confirmed! Please check your inbox for a verification link OR disable 'Confirm Email' in your Supabase Dashboard under Authentication -> Providers -> Email.";
            }
            setError(userMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-dark)',
            padding: '24px',
            backgroundImage: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(120,100,200,0.18) 0%, transparent 70%)',
        }}>
            <div className="login-card animate-fade" style={{
                width: '100%',
                maxWidth: '420px',
                padding: '48px',
                textAlign: 'center',
            }}>
                {/* Logo / Brand */}
                <div style={{ marginBottom: '40px' }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '18px',
                        background: 'linear-gradient(135deg, #fff 0%, #c8c8e8 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        margin: '0 auto 20px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.4), inset 0 2px 0 rgba(255,255,255,1)',
                    }}>🍜</div>
                    <h1 style={{
                        fontSize: '2.2rem',
                        fontWeight: '800',
                        marginBottom: '6px',
                        letterSpacing: '-0.05em',
                        background: 'linear-gradient(135deg, #fff 0%, #a0a0c0 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}>
                        snackssmania
                    </h1>
                    <p style={{ color: 'var(--text-faint)', fontSize: '0.88rem', letterSpacing: '0.04em', fontWeight: '600', textTransform: 'uppercase' }}>Admin Portal</p>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(248,113,113,0.08)',
                        color: '#fca5a5',
                        padding: '14px 16px',
                        borderRadius: '12px',
                        marginBottom: '24px',
                        fontSize: '0.88rem',
                        border: '1px solid rgba(248,113,113,0.2)',
                        textAlign: 'left',
                        lineHeight: '1.5',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                    }}>
                        ⚠ {error}
                    </div>
                )}

                <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px', marginLeft: '2px', fontWeight: '700', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Email Address</label>
                        <input
                            type="email"
                            placeholder="admin@snackssmania.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{ width: '100%', padding: '15px 18px', fontSize: '0.95rem' }}
                        />
                    </div>

                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px', marginLeft: '2px', fontWeight: '700', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ width: '100%', padding: '15px 18px', fontSize: '0.95rem' }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                        style={{
                            padding: '16px',
                            borderRadius: '18px',
                            fontWeight: '800',
                            fontSize: '1rem',
                            marginTop: '8px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            letterSpacing: '-0.01em',
                        }}
                    >
                        {loading ? 'Signing In…' : (isLogin ? 'Sign In →' : 'Create Account →')}
                    </button>
                </form>

                <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <p style={{ color: 'var(--text-faint)', fontSize: '0.88rem' }}>
                        {isLogin ? "Don't have an account?" : 'Already have an account?'}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                fontWeight: '700',
                                marginLeft: '8px',
                                cursor: 'pointer',
                                fontSize: '0.88rem',
                                textDecoration: 'underline',
                                textUnderlineOffset: '3px',
                            }}
                        >
                            {isLogin ? 'Sign Up' : 'Log In'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
