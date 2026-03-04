'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function YouTubeCallbackPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState('Connecting your YouTube account...');

    useEffect(() => {
        handleCallback();
    }, []);

    const handleCallback = async () => {
        const code = searchParams.get('code');

        if (!code) {
            setStatus('Error: No authorization code received.');
            return;
        }

        try {
            // Get current user ID from Supabase
            const supabase = createClient();
            const { data } = await supabase.auth.getUser();
            const userId = data.user?.id;

            if (!userId) {
                setStatus('Error: You must be signed in.');
                return;
            }

            // Exchange code for tokens via backend
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
            const res = await fetch(`${backendUrl}/youtube/callback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, userId }),
            });

            const result = await res.json();

            if (result.success) {
                setStatus('YouTube connected! Redirecting...');

                // Check if there's a pending post action
                const pendingRaw = sessionStorage.getItem('pendingPost');
                if (pendingRaw) {
                    const pending = JSON.parse(pendingRaw);
                    // Redirect back to the replies page — the pending post will auto-fire
                    const title = sessionStorage.getItem('videoTitle') || '';
                    router.push(`/replies/${pending.videoId}?title=${encodeURIComponent(title)}`);
                } else {
                    // Redirect to dashboard if no pending action
                    router.push('/dashboard');
                }
            } else {
                setStatus(`Error: ${result.error || 'Failed to connect YouTube.'}`);
            }
        } catch (err) {
            console.error('Callback error:', err);
            setStatus('Connection failed. Please try again.');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'rgba(5, 5, 25, 0.98)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Inter, sans-serif',
            color: '#f8fafc',
        }}>
            <div style={{
                textAlign: 'center',
                padding: '40px',
                background: 'rgba(30, 41, 59, 0.6)',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.1)',
                maxWidth: '400px',
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid rgba(255,255,255,0.1)',
                    borderTopColor: '#3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 20px',
                }}></div>
                <p style={{ fontSize: '1rem' }}>{status}</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </div>
    );
}
