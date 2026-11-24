import { useEffect, useMemo, useState } from 'react';
import { supabase } from './lib/supabase';
import { chapter1Quests, getRoundLocation, type EncounterGroup, type Quest, type Weather } from './data/chapter1';
import { Bell, BookOpen, Box, ChevronDown, CircleHelp, Clock3, CloudRain, Compass, Crown, Gem, Heart, Leaf, LogIn, LogOut, Map, Menu, Moon, Save, Shield, ShoppingBag, Sparkles, Sun, Swords, UserRound, Users, X } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

type StoryProgress = { chapter: number; quest_id: string; round_number: number };
type ProtagonistGender = 'male' | 'female';
const START: StoryProgress = { chapter: 1, quest_id: 'q1_starville', round_number: 1 };

function validGender(value: unknown): value is ProtagonistGender { return value === 'male' || value === 'female'; }
function protagonistImage(gender: ProtagonistGender) { return `/assets/characters/protagonist-${gender}.webp`; }

export default function App() {
  const [questId, setQuestId] = useState(START.quest_id);
  const [round, setRound] = useState(START.round_number);
  const [time, setTime] = useState<'DAY' | 'NIGHT'>('DAY');
  const [weather, setWeather] = useState<Weather>('NONE');
  const [session, setSession] = useState<Session | null>(null);
  const [gender, setGender] = useState<ProtagonistGender | null>(() => {
    const stored = localStorage.getItem('sq_protagonist_gender');
    return validGender(stored) ? stored : null;
  });
  const [characterReady, setCharacterReady] = useState(false);
  const [characterOpen, setCharacterOpen] = useState(false);
  const [wallet, setWallet] = useState<{ gold: number; gems: number; reset_tokens: number } | null>(null);
  const [view, setView] = useState('Progress');
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [saved, setSaved] = useState(true);
  const quest = chapter1Quests.find((q) => q.id === questId) ?? chapter1Quests[0];
  const roundRange = Array.from({ length: quest.rounds[1] - quest.rounds[0] + 1 }, (_, i) => quest.rounds[0] + i);

  useEffect(() => {
    const local = localStorage.getItem('sq_guest_progress');
    if (local) {
      try { const p = JSON.parse(local) as StoryProgress; if (p.chapter === 1 && chapter1Quests.some((q) => q.id === p.quest_id)) { setQuestId(p.quest_id); setRound(p.round_number); } } catch { localStorage.removeItem('sq_guest_progress'); }
    }
    if (!supabase) { setCharacterReady(true); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setCharacterReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session || !supabase) return;
    const cloudGender = session.user.user_metadata?.protagonist_gender;
    if (validGender(cloudGender)) {
      setGender(cloudGender);
      localStorage.setItem('sq_protagonist_gender', cloudGender);
      return;
    }
    const localGender = localStorage.getItem('sq_protagonist_gender');
    if (validGender(localGender)) void supabase.auth.updateUser({ data: { protagonist_gender: localGender } });
  }, [session]);

  useEffect(() => {
    if (!session || !supabase) { setWallet(null); return; }
    let cancelled = false;
    void (async () => {
      const userId = session.user.id;
      const [profileResult, progressResult, walletResult] = await Promise.all([
        supabase!.from('sq_player_profiles').upsert({ user_id: userId, display_name: session.user.email?.split('@')[0] ?? 'Trainer' }, { onConflict: 'user_id', ignoreDuplicates: true }),
        supabase!.from('sq_story_progress').select('chapter,quest_id,round_number').eq('user_id', userId).maybeSingle(),
        supabase!.from('sq_player_wallets').select('gold,gems,reset_tokens').eq('user_id', userId).maybeSingle(),
      ]);
      if (cancelled) return;
      if (profileResult.error) setMessage(profileResult.error.message);
      if (progressResult.data?.chapter === 1 && chapter1Quests.some((q) => q.id === progressResult.data.quest_id)) {
        const validQuest = chapter1Quests.find((q) => q.id === progressResult.data!.quest_id)!;
        const validRound = Math.min(validQuest.rounds[1], Math.max(validQuest.rounds[0], progressResult.data.round_number));
        setQuestId(validQuest.id); setRound(validRound);
      } else if (progressResult.error) setMessage(progressResult.error.message);
      else {
        let initialProgress = START;
        const guestProgress = localStorage.getItem('sq_guest_progress');
        if (guestProgress) {
          try {
            const parsed = JSON.parse(guestProgress) as StoryProgress;
            const guestQuest = chapter1Quests.find((q) => q.id === parsed.quest_id);
            if (parsed.chapter === 1 && guestQuest) initialProgress = { chapter: 1, quest_id: guestQuest.id, round_number: Math.min(guestQuest.rounds[1], Math.max(guestQuest.rounds[0], parsed.round_number)) };
          } catch { localStorage.removeItem('sq_guest_progress'); }
        }
        const { error } = await supabase!.from('sq_story_progress').upsert({ user_id: userId, ...initialProgress }, { onConflict: 'user_id' });
        if (error) setMessage(error.message);
        else { setQuestId(initialProgress.quest_id); setRound(initialProgress.round_number); }
      }
      setWallet(walletResult.data ?? null);
    })();
    return () => { cancelled = true; };
  }, [session]);

  const encounters = useMemo(() => {
    if (weather === 'INSCENTED') return quest.encounters.INSCENTED;
    if (weather === 'RAIN') return quest.encounters.RAIN;
    return quest.encounters[time];
  }, [quest, time, weather]);

  async function saveProgress(nextQuest = quest, nextRound = round) {
    const progress = { chapter: 1, quest_id: nextQuest.id, round_number: nextRound };
    localStorage.setItem('sq_guest_progress', JSON.stringify(progress));
    setSaved(false);
    if (session && supabase) {
      const { error } = await supabase.from('sq_story_progress').upsert({ user_id: session.user.id, ...progress, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      if (error) setMessage(error.message);
    }
    setSaved(true);
  }

  function selectQuest(next: Quest) { setQuestId(next.id); setRound(next.rounds[0]); void saveProgress(next, next.rounds[0]); }
  function selectRound(next: number) { setRound(next); void saveProgress(quest, next); }

  async function chooseProtagonist(next: ProtagonistGender) {
    setGender(next);
    localStorage.setItem('sq_protagonist_gender', next);
    setCharacterOpen(false);
    if (session && supabase) {
      const { error } = await supabase.auth.updateUser({ data: { protagonist_gender: next } });
      if (error) setMessage(error.message);
    }
  }

  async function submitAuth(event: React.FormEvent) {
    event.preventDefault(); if (!supabase) { setMessage('Supabase is not configured.'); return; }
    setMessage('');
    const result = authMode === 'signup'
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) setMessage(result.error.message);
    else if (authMode === 'signup' && !result.data.session) setMessage('Check your email to confirm your account.');
    else { setAuthOpen(false); setMessage(''); }
  }

  async function googleLogin() {
    if (!supabase) return setMessage('Supabase is not configured.');
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    if (error) setMessage(error.message);
  }

  async function logout() { if (supabase) await supabase.auth.signOut(); setWallet(null); }

  const location = getRoundLocation(quest, round);
  const isSpecial = weather === 'INSCENTED';

  return <div className="game-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-mark"><Sparkles size={19} /></span><span>STARMON <b>QUEST</b></span><i>CHAPTER 1</i></div>
      <div className="account-strip">
        <div className="trainer-avatar">{gender ? <img src={protagonistImage(gender)} alt={`${gender} protagonist`} /> : <UserRound size={18} />}</div>
        <div className="trainer-name"><strong>{session?.user.email?.split('@')[0] ?? 'Guest Trainer'}</strong><small>{session ? 'Cloud save' : 'Local save'}</small></div>
        <div className="currency"><span className="coin gold">G</span><b>{wallet ? wallet.gold.toLocaleString() : '—'}</b></div>
        <div className="currency"><Gem size={16} className="gem" /><b>{wallet ? wallet.gems.toLocaleString() : '—'}</b></div>
        <div className="currency"><span className="reset-token">↻</span><b>{wallet ? wallet.reset_tokens : '—'}</b></div>
        <div className="playtime"><Clock3 size={15} /><span>PLAYTIME</span></div>
        {session ? <button className="save-button" onClick={() => void saveProgress()}><Save size={15} /> SAVE</button> : <button className="save-button" onClick={() => { setAuthMode('signin'); setAuthOpen(true); }}><LogIn size={15} /> SIGN IN</button>}
      </div>
    </header>

    <div className="layout">
      <aside className="left-rail">
        <section className="location-card"><div className="location-heading"><Map size={15} /> CHAPTER 1</div><h2>{quest.title}</h2><p>{location}</p><div className="progress-track"><span style={{ width: `${(round / 30) * 100}%` }} /></div><div className="progress-caption"><span>ROUND {round} / 30</span><span>LV 1–30</span></div></section>
        <nav className="main-nav">
          <NavButton active={view === 'Progress'} onClick={() => setView('Progress')} icon={<Compass size={17} />} label="Progress" />
          <NavButton active={false} onClick={() => setMessage('Team/PC content is not specified in the supplied mechanics document.')} icon={<Users size={17} />} label="Team / PC" />
          <NavButton active={false} onClick={() => setMessage('Starmon Inventory content is not specified in the supplied mechanics document.')} icon={<Box size={17} />} label="Starmon Inventory" badge="1" />
          <NavButton active={false} onClick={() => setMessage('Activities content is not specified in the supplied mechanics document.')} icon={<Sparkles size={17} />} label="Activities" trailing={<ChevronDown size={14} />} />
          <NavButton active={false} onClick={() => setMessage('Social content is not specified in the supplied mechanics document.')} icon={<Users size={17} />} label="Social" trailing={<ChevronDown size={14} />} />
          <NavButton active={false} onClick={() => setMessage('Shop content is not specified in the supplied mechanics document.')} icon={<ShoppingBag size={17} />} label="Shop" />
          <NavButton active={false} onClick={() => setMessage('Achievements content is not specified in the supplied mechanics document.')} icon={<Crown size={17} />} label="Achievements" />
        </nav>
        <button className="guide-button" onClick={() => setMessage('Guide content is not specified in the supplied mechanics document.')}><BookOpen size={17} /> GUIDE</button>
        {supabase && (session ? <button className="text-button signout" onClick={() => void logout()}><LogOut size={15} /> Sign out</button> : <button className="text-button" onClick={() => { setAuthMode('signin'); setAuthOpen(true); }}><LogIn size={15} /> Account sign in</button>)}
      </aside>

      <main className="center-stage">
        <div className="quest-bar"><div><span className="eyebrow">THE BEGINNING JOURNEY</span><h1>{view === 'Progress' ? location : view}</h1></div><div className="chapter-pill"><Leaf size={14} /> CHAPTER 1 <span>·</span> LV 1–30</div></div>
        <div className="round-ribbon" aria-label="Chapter 1 rounds">
          {Array.from({ length: 30 }, (_, i) => { const n = i + 1; const q = chapter1Quests.find((item) => n >= item.rounds[0] && n <= item.rounds[1])!; const current = n === round && q.id === quest.id; return <button key={n} title={`${q.title} — Round ${n}`} className={`round-dot ${current ? 'current' : ''}`} onClick={() => { setQuestId(q.id); setRound(n); void saveProgress(q, n); }}>{current ? '◆' : '?'}</button>; })}
        </div>
        <section className="battle-room">
          <div className="room-topline"><span className="room-label"><Swords size={14} /> JOURNEY PROGRESS</span><span className="room-count">{round} / 30 <span className="flag">⚑</span></span></div>
          <div className="window left-window"><div className="sky" /><div className="shore" /></div><div className="window right-window"><div className="sky" /><div className="shore" /></div>
          <div className="lamp lamp-left"><span /></div><div className="lamp lamp-right"><span /></div>
          <div className="wood-door door-left"><span /></div><div className="wood-door door-right"><span /></div>
          <div className="battle-platform"><div className="platform-glow"/><div className="empty-mark"><Compass size={48} strokeWidth={1.2} /><span>ROUND {round}</span><small>{quest.title}</small></div></div>
          <div className="story-caption"><b>{specialEncounter(quest, round)}</b><span>{roundKind(quest, round)} · Round {round}</span></div>
          <div className="party-column player-party"><h3>YOUR PARTY</h3>{Array.from({ length: 6 }, (_, i) => <div className="party-slot" key={i}><span>{i + 1}</span><div className="slot-orbit"><Sparkles size={15}/></div><small>—</small></div>)}</div>
          <div className="party-column rival-party"><h3>ENCOUNTER</h3><div className="enemy-card"><div className="enemy-orbit"><Swords size={26}/></div><strong>{specialEncounter(quest, round)}</strong><small>{roundKind(quest, round)}</small></div></div>
        </section>
        <div className="below-stage">
          <section className="quest-select card-panel"><div className="panel-head"><div><span className="eyebrow">CHAPTER ROUTE</span><h2>Quest map</h2></div><span className="count-badge">5 QUESTS</span></div>
            <div className="quest-list">{chapter1Quests.map((q, i) => <button key={q.id} className={`quest-row ${q.id === quest.id ? 'selected' : ''}`} onClick={() => selectQuest(q)}><span className="quest-index">Q{i + 1}</span><span className="quest-name">{q.title}<small>{q.locations[0]} → {q.locations[1]}</small></span><span className="quest-rounds">R{q.rounds[0]}–{q.rounds[1]}</span></button>)}</div>
            <TrainerRoster quest={quest} />
          </section>
          <section className="round-select card-panel"><div className="panel-head"><div><span className="eyebrow">CURRENT QUEST</span><h2>Rounds</h2></div><span className="count-badge">{quest.locations.join(' · ')}</span></div><div className="round-grid">{roundRange.map((n) => <button key={n} className={n === round ? 'active' : ''} onClick={() => selectRound(n)}>R{n}<small>{getRoundLocation(quest, n)}</small></button>)}</div>
          </section>
        </div>
      </main>

      <aside className="right-rail">
        <section className="card-panel consumables"><div className="panel-head"><div><span className="eyebrow">FIELD KIT</span><h2>Consumables</h2></div><button className="bag-button" onClick={() => setMessage('Starmon Inventory content is not specified in the supplied mechanics document.')}>BAG</button></div><div className="item-slots">{[0, 1, 2].map((i) => <div className="item-slot" key={i}><button className="help-dot" title="Item details are not specified in the supplied mechanics document."><CircleHelp size={13}/></button><span>?</span><small>—</small></div>)}</div><p className="micro-note">Item identities and quantities are not listed in the document.</p></section>
        <section className="card-panel found-panel"><div className="panel-head"><div><span className="eyebrow">WILD STARMON</span><h2>Found Here</h2></div><span className="route-badge">{location}</span></div><div className="field-controls"><div className="segmented"><button className={time === 'DAY' ? 'active' : ''} onClick={() => { setTime('DAY'); setWeather('NONE'); }}><Sun size={14}/> DAY</button><button className={time === 'NIGHT' ? 'active' : ''} onClick={() => { setTime('NIGHT'); setWeather('NONE'); }}><Moon size={14}/> NIGHT</button></div><select value={weather} onChange={(e) => setWeather(e.target.value as Weather)} aria-label="Weather"><option value="NONE">NONE</option><option value="RAIN">RAIN</option><option value="INSCENTED">INSCENTED</option></select></div>
          {isSpecial && <div className="lock-note"><Shield size={14}/> Event encounters require a rarity item.</div>}
          {!encounters.length ? <div className="empty-encounters"><CloudRain size={18}/><span>No encounter table is specified for this weather at this Quest.</span></div> : <EncounterTable groups={encounters} locked={isSpecial} special={isSpecial} />}
          <div className="legendary-note"><span className="legendary-star">✦</span><span>Legendary and event encounters require a rarity item.</span></div>
        </section>
        <section className="trainer-card"><div className="trainer-card-icon">{gender ? <img src={protagonistImage(gender)} alt="" /> : <UserRound size={18}/>}</div><div><span className="eyebrow">TRAINER</span><b>{session?.user.email?.split('@')[0] ?? 'Guest Trainer'}</b><small>{gender ? `${gender === 'male' ? 'Male' : 'Female'} protagonist · ` : ''}Chapter 1 · {quest.title}</small></div><button className="change-avatar" onClick={() => setCharacterOpen(true)}>CHANGE</button></section>
        <div className="sync-line"><span className={saved ? 'sync-dot' : 'sync-dot syncing'} />{saved ? (session ? 'Cloud progress saved' : 'Guest progress saved on this device') : 'Saving progress…'}</div>
      </aside>
    </div>

    {message && <div className="toast" role="status"><span>{message}</span><button onClick={() => setMessage('')}><X size={16}/></button></div>}
    {characterReady && (characterOpen || !gender) && <div className="modal-backdrop character-backdrop"><section className="character-modal"><span className="eyebrow">STARMON QUEST · TRAINER PROFILE</span><h2>Choose your protagonist</h2><p>Your choice is saved for this Guest profile and synced to Supabase when signed in.</p><div className="character-choices"><button className={`character-choice ${gender === 'male' ? 'chosen' : ''}`} onClick={() => void chooseProtagonist('male')}><img src={protagonistImage('male')} alt="Male protagonist"/><span>Male protagonist</span></button><button className={`character-choice ${gender === 'female' ? 'chosen' : ''}`} onClick={() => void chooseProtagonist('female')}><img src={protagonistImage('female')} alt="Female protagonist"/><span>Female protagonist</span></button></div></section></div>}
    {authOpen && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setAuthOpen(false); }}><section className="auth-modal"><button className="modal-close" onClick={() => setAuthOpen(false)}><X size={18}/></button><span className="eyebrow">STARMON QUEST ACCOUNT</span><h2>{authMode === 'signin' ? 'Welcome back, Trainer' : 'Create your account'}</h2><p>Cloud saves are linked to your Supabase account. Guest progress stays on this device.</p><form onSubmit={(e) => void submitAuth(e)}><label>Email<input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label><label>Password<input type="password" autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'} minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} /></label><button className="primary-action" type="submit">{authMode === 'signin' ? 'Sign in' : 'Create account'}</button></form><div className="auth-divider"><span>OR</span></div><button className="google-button" onClick={() => void googleLogin()}>Continue with Google</button><button className="text-button mode-switch" onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}>{authMode === 'signin' ? 'Create a new account' : 'I already have an account'}</button></section></div>}
  </div>;
}

function NavButton({ active, onClick, icon, label, badge, trailing }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: string; trailing?: React.ReactNode }) {
  return <button className={`nav-button ${active ? 'active' : ''}`} onClick={onClick}>{icon}<span>{label}</span>{badge && <i className="nav-badge">{badge}</i>}{trailing}</button>;
}

function EncounterTable({ groups, locked, special }: { groups: EncounterGroup[]; locked: boolean; special: boolean }) {
  const colors: Record<string, string> = { Common: 'rarity-common', Uncommon: 'rarity-uncommon', Rare: 'rarity-rare', 'Ultra Rare': 'rarity-ultra', Legendary: 'rarity-legendary' };
  const rates: Record<string, number> = special ? { Common: 45, Uncommon: 27, Rare: 18, 'Ultra Rare': 7, Legendary: 3 } : { Common: 60, Uncommon: 25, Rare: 12, 'Ultra Rare': 3 };
  return <div className="encounter-list">{groups.map((group) => <div className="rarity-group" key={group.rarity}><div className={`rarity-heading ${colors[group.rarity]}`}><span>{group.rarity}</span><i>{rates[group.rarity] !== undefined ? `${rates[group.rarity]}%` : ''}</i></div><div className="species-grid">{group.entries.map((entry) => <div className={`species-entry ${entry.name === 'Cervalor' ? 'legendary-entry' : ''}`} key={entry.name}><span className="species-icon">{entry.name === 'Cervalor' ? '✦' : <Sparkles size={13}/>}</span><span className="species-name">{entry.name}</span>{entry.chance !== undefined && <b>{entry.chance}%</b>}{entry.name === 'Cervalor' && <small>{locked ? 'LOCKED' : 'RARITY ITEM'}</small>}</div>)}</div></div>)}</div>;
}

function TrainerRoster({ quest }: { quest: Quest }) {
  const portraits: Record<string, { src: string; label: string }[]> = {
    Schoolkid: [
      { src: '/assets/characters/schoolkid-male.png', label: 'Male schoolkid' },
      { src: '/assets/characters/schoolkid-female.png', label: 'Female schoolkid' },
    ],
    Highschooler: [
      { src: '/assets/characters/highschooler-male.png', label: 'Male highschooler' },
      { src: '/assets/characters/highschooler-female.png', label: 'Female highschooler' },
    ],
    'Bug Collector': [{ src: '/assets/characters/bug-collector-male.png', label: 'Male bug collector' }],
  };
  return <div className="trainer-roster"><span className="eyebrow">TRAINERS LISTED IN QUEST</span>{quest.trainers.map((trainer) => <div className="trainer-type" key={trainer.job}><div className="trainer-type-heading"><b>{trainer.job}</b><span>{trainer.names.join(' · ')}</span></div>{portraits[trainer.job] && <div className="trainer-portraits">{portraits[trainer.job].map((portrait) => <div className="trainer-portrait" key={portrait.src}><img src={portrait.src} alt={portrait.label} /><span>{portrait.label}</span></div>)}</div>}</div>)}</div>;
}

function roundKind(quest: Quest, round: number) {
  if (quest.thugs.some((x) => x.round === round)) return 'Thug encounter';
  if (quest.challengers.some((x) => x.round === round)) return quest.id === 'q5_deep_canopy' ? 'Final Ace' : 'Challenger';
  return 'Trainer encounter';
}
function specialEncounter(quest: Quest, round: number) {
  const thug = quest.thugs.find((x) => x.round === round);
  const challenger = quest.challengers.find((x) => x.round === round);
  if (thug) return `Thugs ${quest.thugs.filter((x) => x.round === round).map((x) => x.name).join(' · ')}`;
  if (challenger) return challenger.name === 'Forest Warden Silas' ? challenger.name : `Challenger ${challenger.name}`;
  return 'Trainer encounter';
}

