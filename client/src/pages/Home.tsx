import type { Navigate } from '../App.tsx';
import CardBack from '../components/CardBack.tsx';
import Logo from '../components/Logo.tsx';
import NameForm from '../components/NameForm.tsx';
import ThemeToggle from '../components/ThemeToggle.tsx';
import { setProfileName, setRoomIdentity } from '../identity.ts';
import { call } from '../socket.ts';

export default function Home({ navigate }: { navigate: Navigate }) {
  return (
    <div className="page">
      <header className="topbar">
        <Logo />
        <div className="topbar-end">
          <ThemeToggle />
        </div>
      </header>
      <main className="home">
        <div className="home-hero">
          <NameForm
            title="Tahmin yapmak oyun gibi olsun."
            subtitle="Hesap yok, kurulum yok. Bir oda kur, linki paylaş, oylamaya başla."
            submitLabel="Oda kur"
            loadingLabel="Oda hazırlanıyor…"
            errorText={(err) => (err.error === 'SERVER_BUSY' ? 'Şu an çok yoğunuz, biraz sonra tekrar dene.' : 'Bir şeyler ters gitti, tekrar dene.')}
            onSubmit={async (name) => {
              const res = await call('room:create', { name });
              if (!res.ok) return res;
              setRoomIdentity(res.roomId, { participantId: res.participantId, token: res.token });
              setProfileName(name.trim());
              navigate(`/r/${res.roomId}`, { justCreated: true });
              return null;
            }}
          />
          <div className="home-deco" aria-hidden="true">
            <CardBack seed="tekne-sol" className="deco-card" />
            <CardBack seed="tekne-sag" className="deco-card" />
            <span className="deco-card deco-face" data-value="8">
              8
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
