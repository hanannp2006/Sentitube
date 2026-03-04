'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import styles from './connect.module.css';

export default function ConnectChannel() {
    const [channelInput, setChannelInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [user, setUser] = useState<any>(null);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/signin');
            } else {
                setUser(user);
            }
        };
        checkUser();
    }, [router, supabase]);

    const handleContinue = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!channelInput.trim()) {
            setError('Please enter a channel handle or link');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { error: insertError } = await supabase
                .from('channels')
                .insert([
                    {
                        user_id: user.id,
                        channel_input: channelInput.trim()
                    }
                ]);

            if (insertError) {
                if (insertError.code === '42P01') {
                    setError('The "channels" table does not exist in Supabase yet. Please create it in your Supabase SQL Editor.');
                } else {
                    setError(insertError.message);
                }
                return;
            }

            router.push('/dashboard');
        } catch (err: any) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null; // Prevent flicker before redirect

    return (
        <div className={styles.connectContainer}>
            <div className={styles.connectCard}>
                <h1 className={styles.title}>Connect Your YouTube Channel</h1>
                <p className={styles.subtitle}>
                    Enter your channel handle or channel link to start analysis
                </p>

                <form onSubmit={handleContinue} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="@yourchannel or https://youtube.com/@yourchannel"
                            value={channelInput}
                            onChange={(e) => setChannelInput(e.target.value)}
                            disabled={loading}
                        />
                        {error && <p className={styles.error}>{error}</p>}
                    </div>

                    <button
                        type="submit"
                        className={styles.button}
                        disabled={loading}
                    >
                        {loading ? 'Connecting...' : 'Continue'}
                    </button>
                </form>
            </div>
        </div>
    );
}
