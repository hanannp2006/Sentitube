'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import styles from '../components/UpgradeModal.module.css'; // Reusing some styles

export default function PaymentSuccessPage() {
    const [status, setStatus] = useState<string>('Verifying your payment...');
    const [isPro, setIsPro] = useState(false);

    useEffect(() => {
        let isMounted = true;
        
        async function checkStatus() {
            try {
                const supabase = createClient();
                const { data } = await supabase.auth.getUser();
                
                if (!data?.user) {
                    if (isMounted) setStatus('Payment received! Please log in to view your Pro features.');
                    return;
                }

                // Call our new backend endpoint to force a refresh of the user's plan state
                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
                const res = await fetch(`${backendUrl}/subscription-status`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: data.user.id })
                });

                if (res.ok) {
                    const result = await res.json();
                    if (result.plan === 'pro') {
                        if (isMounted) {
                            setIsPro(true);
                            setStatus('Payment verified! Your account has been upgraded to Pro.');
                        }
                    } else {
                        // Sometimes webhooks take a few seconds to process
                        if (isMounted) setStatus('Payment received! Your account will be upgraded momentarily.');
                    }
                }
            } catch (error) {
                console.error("Error verifying status:", error);
                if (isMounted) setStatus('Payment received! It might take a moment to reflect on your account.');
            }
        }

        checkStatus();

        return () => {
            isMounted = false;
        };
    }, []);

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
                    🎉
                </div>
                
                <h1 style={{
                    fontSize: '24px',
                    fontWeight: 600,
                    marginBottom: '12px',
                    background: 'linear-gradient(90deg, #fff, #a0a0a0)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Payment Successful
                </h1>
                
                <p style={{
                    fontSize: '15px',
                    color: '#888',
                    lineHeight: '1.5',
                    marginBottom: '32px'
                }}>
                    {status}
                </p>
                
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
    );
}
