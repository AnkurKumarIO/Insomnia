const fs = require('fs');
const file = 'c:/Users/garvk/OneDrive/Desktop/Hackathon1/frontend/src/pages/AlumniDashboard.jsx';

let text = fs.readFileSync(file, 'utf8');

// Exact old block to replace (polling every 5s)
const OLD_BLOCK = `    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [user.name, user.id]);`;

// New block with Realtime subscription appended after the initial load
const NEW_BLOCK = `    load();

    // Supabase Realtime — fires instantly on new/updated requests for this alumni
    let channel = null;
    let supabaseRef = null;
    (async () => {
      try {
        let alumniId = user.id;
        const isMockId = !alumniId || String(alumniId).startsWith('alm-') || String(alumniId).startsWith('stu-');
        if (isMockId) {
          const { getAllAlumni } = await import('../lib/db');
          const alumniList = await getAllAlumni();
          const match = alumniList.find(a => a.name === user.name);
          if (match) alumniId = match.id;
        }
        if (alumniId && !String(alumniId).startsWith('alm-') && !String(alumniId).startsWith('stu-')) {
          const { supabase } = await import('../lib/supabaseClient');
          supabaseRef = supabase;
          channel = supabase
            .channel(\`alumni-reqs-\${alumniId}\`)
            .on('postgres_changes',
              { event: 'INSERT', schema: 'public', table: 'interview_requests', filter: \`alumni_id=eq.\${alumniId}\` },
              () => load()
            )
            .on('postgres_changes',
              { event: 'UPDATE', schema: 'public', table: 'interview_requests', filter: \`alumni_id=eq.\${alumniId}\` },
              () => load()
            )
            .subscribe();
        }
      } catch(e) { console.warn('Alumni Realtime setup failed:', e.message); }
    })();

    return () => {
      try { if (channel && supabaseRef) supabaseRef.removeChannel(channel); } catch {}
    };
  }, [user.name, user.id]);`;

if (text.includes(OLD_BLOCK)) {
  text = text.replace(OLD_BLOCK, NEW_BLOCK);
  fs.writeFileSync(file, text, 'utf8');
  console.log('SUCCESS: Realtime block applied cleanly');
} else {
  // Try with CRLF
  const OLD_CRLF = OLD_BLOCK.replace(/\n/g, '\r\n');
  if (text.includes(OLD_CRLF)) {
    const NEW_CRLF = NEW_BLOCK.replace(/\n/g, '\r\n');
    text = text.replace(OLD_CRLF, NEW_CRLF);
    fs.writeFileSync(file, text, 'utf8');
    console.log('SUCCESS: Realtime block applied (CRLF mode)');
  } else {
    console.log('FAIL: Old block not found');
    // Print what we expect to find
    const idx = text.indexOf('setInterval(load, 5000)');
    if (idx !== -1) {
      console.log('Context around setInterval:', JSON.stringify(text.substring(idx - 20, idx + 60)));
    }
  }
}
