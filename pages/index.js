import { useEffect, useState } from 'react';
import supabase from '../lib/supabaseClient';
import Head from 'next/head';

export default function Home() {
  const [channels, setChannels] = useState([]);
  const [nowPlaying, setNowPlaying] = useState('Now Playing: --');
  const [videoUrl, setVideoUrl] = useState('/standby.mp4');
  const [ticker, setTicker] = useState('Welcome to Black Truth TV Network — Your History, Your Voice, Your Future.');

  const channelPasswords = {
    23: "channel23pass",
    24: "channel24pass",
    25: "channel25pass",
    26: "channel26pass",
    27: "channel27pass",
    28: "channel28pass",
    29: "channel29pass"
  };

  useEffect(() => {
    const loadChannels = async () => {
      const { data, error } = await supabase.from('channels').select('*').order('id');
      if (error) {
        console.error("Error loading channels", error.message);
        return;
      }
      setChannels(data);
    };
    loadChannels();
  }, []);

  const loadChannel = async (channelId) => {
    if (channelPasswords[channelId]) {
      const input = prompt("Enter password for this channel:");
      if (input !== channelPasswords[channelId]) {
        alert("Incorrect password.");
        return;
      }
    }

    const bucket = `channel${channelId}`;
    const { data: programs, error } = await supabase
      .from('programs')
      .select('*')
      .eq('channel_id', channelId)
      .order('start_time');

    if (error) {
      console.error("Program load error:", error.message);
      return;
    }

    const now = new Date();
    const current = programs.find(p => new Date(p.start_time) <= now);
    const next = programs.find(p => new Date(p.start_time) > now);

    if (current?.mp4_url) {
      const fullUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${current.mp4_url}`;
      setVideoUrl(fullUrl);
      setNowPlaying(`Now Playing: ${current.title}`);
    } else {
      const standbyUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/standby.mp4`;
      setVideoUrl(standbyUrl);
      setNowPlaying('Now Playing: Standby');
    }

    const { data: manual } = await supabase
      .from('ticker')
      .select('*')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (manual?.length) {
      setTicker(prev => `${prev} | ${manual[0].message}`);
    }
  };

  return (
    <>
      <Head>
        <title>Black Truth TV</title>
      </Head>
      <div style={{ display: 'flex', height: '100vh', background: 'black', color: 'white' }}>
        <div style={{ width: 280, overflowY: 'auto', background: '#111', padding: 20 }}>
          <h3 style={{ color: 'gold' }}>Channel Guide</h3>
          {channels.map(ch => (
            <div
              key={ch.id}
              onClick={() => loadChannel(ch.id)}
              style={{ background: '#1a1a1a', marginBottom: 10, padding: 10, borderRadius: 6, cursor: 'pointer' }}
            >
              <h4 style={{ margin: 0, color: 'gold' }}>{ch.name}</h4>
              <p style={{ fontSize: '0.8em', color: '#ccc' }}>{ch.description}</p>
            </div>
          ))}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 10, background: '#000', display: 'flex', alignItems: 'center' }}>
            <img src="/blacktruth1.jpeg" alt="Black Truth TV" style={{ height: 60, marginRight: 20 }} />
            <h1 style={{ color: 'gold', fontSize: '1.5em' }}>Black Truth TV</h1>
          </div>
          <div style={{ padding: 10, background: '#222', color: '#0f0', fontWeight: 'bold', textAlign: 'center' }}>{nowPlaying}</div>
          <div style={{ flex: 1, position: 'relative' }}>
            <video
              src={videoUrl}
              controls
              autoPlay
              style={{ width: '100%', height: '100%' }}
              poster="/blacktruth1.jpeg"
              onError={() => {
                console.warn('Fallback to public standby');
                setVideoUrl('/standby.mp4');
              }}
            />
            <div style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.6)', padding: 10 }}>
              <marquee>{ticker}</marquee>
            </div>
          </div>
          <footer style={{ textAlign: 'center', padding: 20, background: '#111', color: 'gold' }}>
            <p>Support our mission. <a href="https://donate.stripe.com/8wM8xL9TreuzeIMcRM" target="_blank" rel="noreferrer" style={{ color: '#ffd700', fontWeight: 'bold' }}>Donate</a></p>
          </footer>
        </div>
      </div>
    </>
  );
}

