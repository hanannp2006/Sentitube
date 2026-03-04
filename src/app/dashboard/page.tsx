import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { fetchChannelData } from '@/utils/youtube';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/signin');
    }

    // Fetch the connected channel for this user
    const { data: channelEntry, error: channelError } = await supabase
        .from('channels')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (channelError || !channelEntry) {
        redirect('/connect-channel');
    }

    let youtubeData: any = null;
    let error: string | null = null;

    try {
        youtubeData = await fetchChannelData(channelEntry.channel_input);
    } catch (e: any) {
        error = e.message;
    }

    return (
        <DashboardClient
            user={user}
            youtubeData={youtubeData}
            error={error}
            channelInput={channelEntry.channel_input}
        />
    );
}
