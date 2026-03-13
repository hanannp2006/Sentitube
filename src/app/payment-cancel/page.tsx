'use client';

import Link from 'next/link';

export default function PaymentCancelPage() {
    return (
        <div style={{
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '100vh',
            backgroundColor: '#0A0A0B',
            color: 'white',
            fontFamily: 'Inter, system-ui, sans-serif'
        }}>
            <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '40px',
                maxWidth: '400px',
                width: '90%',
                textAlign: 'center',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
            }}>
                <div style={{
                    fontSize: '48px',
                    marginBottom: '16px'
                }}>
                    ❌
                </div>
                
                <h1 style={{
                    fontSize: '24px',
                    fontWeight: 600,
                    marginBottom: '12px',
                    color: '#ff4d4f'
                }}>
                    Payment Cancelled
                </h1>
                
                <p style={{
                    fontSize: '15px',
                    color: '#888',
                    lineHeight: '1.5',
                    marginBottom: '32px'
                }}>
                    Your checkout was cancelled. You have not been charged.
                </p>
                
                <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
                    <Link href="/dashboard" style={{
                        display: 'inline-block',
                        width: '100%',
                        padding: '12px',
                        backgroundColor: 'white',
                        color: 'black',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        fontWeight: 500,
                        transition: 'all 0.2s ease',
                    }}>
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
