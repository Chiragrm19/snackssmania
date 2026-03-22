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
            padding: '24px'
        }}>
            <div className="glass animate-fade" style={{
                width: '100%',
                maxWidth: '420px',
                padding: '48px',
                borderRadius: '24px',
                textAlign: 'center',
                boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)'
            }}>
                <div style={{ marginBottom: '40px' }}>
                    <h1 style={{
                        fontSize: '2.5rem',
                        fontWeight: '700',
                        marginBottom: '8px',
                        color: 'var(--text-main)',
                        letterSpacing: '-0.04em'
                    }}>
                        SNACKSMANIA
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', letterSpacing: '0.02em', fontWeight: '500' }}>Admin Portal Access</p>
                </div>

                {error && (
                    <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        color: 'var(--text-main)',
                        padding: '16px',
                        borderRadius: '12px',
                        marginBottom: '24px',
                        fontSize: '0.9rem',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', marginLeft: '4px', fontWeight: '500' }}>Email Address</label>
                        <input
                            type="email"
                            placeholder="admin@snacksmania.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '16px',
                                borderRadius: '16px',
                                backgroundColor: 'var(--glass)',
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-main)',
                                outline: 'none',
                                fontSize: '1rem',
                                transition: 'all 0.3s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--text-muted)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
                        />
                    </div>

                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', marginLeft: '4px', fontWeight: '500' }}>Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '16px',
                                borderRadius: '16px',
                                backgroundColor: 'var(--glass)',
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-main)',
                                outline: 'none',
                                fontSize: '1rem',
                                transition: 'all 0.3s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--text-muted)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: '16px',
                            borderRadius: '16px',
                            backgroundColor: 'var(--accent-white)',
                            color: 'var(--bg-dark)',
                            fontWeight: '700',
                            fontSize: '1rem',
                            marginTop: '16px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            letterSpacing: '-0.01em'
                        }}
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                <div style={{ marginTop: '32px' }}>
                    <p style={{ color: 'var(--text-faint)', fontSize: '0.9rem' }}>
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            style={{
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: 'var(--text-main)',
                                fontWeight: '600',
                                marginLeft: '8px',
                                cursor: 'pointer',
                                letterSpacing: '-0.01em'
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
