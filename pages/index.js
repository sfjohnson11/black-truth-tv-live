import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [channels, setChannels] = useState([]);
  const [nowPlaying, setNowPlaying] = useState('Now Playing: --');
  const [ticker, setTicker] = useState('Welcome to Black Truth TV Network — Your History, Your Voice, Your Future.');
  const [videoUrl, setVideoUrl] = useState('');
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
    async function fetchChannels() {
      const { data } = await supabase.from('channels').select('*').order('id');
      setChannels(data);
    }
    fetchChannels();
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
    const { data: programs } = await supabase.from('programs').select('*').eq('channel_id', channelId).order('start_time');
    const now = new Date();
    const current = programs.find(p => new Date(p.start_time) <= now);
    const next = programs.find(p => new Date(p.start_time) > now);

    if (current?.mp4_url) {
      setVideoUrl(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${current.mp4_url}`);
      setNowPlaying(`Now Playing: ${current.title}`);
    } else {
      setVideoUrl(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/standby.mp4`);
      setNowPlaying("Now Playing: --");
    }

    if (next?.title) {
      setTicker(`Coming Up Next: ${next.title}`);
    }

    const { data: manual } = await supabase.from('ticker').select('*').eq('is_active', true).order('updated_at', { ascending: false }).limit(1);
    if (manual?.length) {
      setTicker(prev => `${prev} | ${manual[0].message}`);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: 'black', color: 'white' }}>
      <div style={{ width: 280, overflowY: 'auto', background: '#111', padding: 20 }}>
        <h3 style={{ color: 'gold' }}>Channel Guide</h3>
        {channels.map(ch => (
          <div key={ch.id} style={{ background: '#1a1a1a', padding: 10, marginBottom: 10, borderRadius: 6, cursor: 'pointer' }} onClick={() => loadChannel(ch.id)}>
            <h4 style={{ margin: 0, color: 'gold' }}>{ch.name}</h4>
            <p style={{ fontSize: '0.8em', color: '#aaa' }}>{ch.description}</p>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#111' }}>
        <div style={{ background: '#000', padding: 10, display: 'flex', alignItems: 'center', borderBottom: '2px solid #222' }}>
          <img src="/blacktruth1.jpeg" alt="Logo" style={{ height: 60, marginRight: 15 }} />
          <h1 style={{ color: 'gold', fontSize: '1.5em', margin: 0 }}>Black Truth TV</h1>
        </div>
        <div style={{ background: '#222', padding: 10, textAlign: 'center', color: '#0f0', fontWeight: 'bold' }}>{nowPlaying}</div>
        <div style={{ flex: 1, position: 'relative' }}>
          <video src={videoUrl} controls autoPlay style={{ width: '100%', height: '100%' }} poster="/blacktruth1.jpeg" />
          <div style={{ position: 'absolute', bottom: 0, width: '100%', padding: 10, background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '0.9em', whiteSpace: 'nowrap' }}>
            {ticker}
          </div>
        </div>
        <footer style={{ background: '#111', color: 'gold', textAlign: 'center', padding: '2em' }}>
          <h2>Support the Movement. Preserve the Truth.</h2>
          <p>Black Truth TV is the first and only 24/7 streaming network dedicated to Black history and resistance in the U.S.</p>
          <a href="https://donate.stripe.com/8wM8xL9TreuzeIMcRM" target="_blank" rel="noopener noreferrer" style={{ background: 'gold', color: '#000', padding: '0.75em 2em', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }}>
            Donate Now
          </a>
        </footer>
      </div>
    </div>
  );
}
