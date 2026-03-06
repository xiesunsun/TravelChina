import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import InkMap from './components/InkMap';
import ScrollList from './components/ScrollList';
import RecordModal from './components/RecordModal';
import { TravelRecord } from './types';
import {
  fetchRecords,
  createRecord,
  updateRecord,
  deleteRecord,
  login as loginWithPassword,
  registerAndLogin,
  logout,
  hasAuthToken,
  AuthRequiredError,
} from './services/apiService';
import { AUTH_RULES, validateAuthInput } from './services/authValidation';
import { LogOut, MapPin, ScrollText } from 'lucide-react';

const Navigation = ({ onLogout }: { onLogout: () => void }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  const linkClass = (path: string) => `
    flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-500 border
    ${isActive(path)
      ? 'bg-cinnabar text-paper shadow-md border-cinnabar'
      : 'bg-paper/80 text-ink border-indigo/20 hover:bg-indigo/5 hover:border-indigo/40'
    }
`;

  return (
    <nav className="fixed top-8 right-8 z-50 flex gap-4 pointer-events-none">
      <div className="flex gap-3 pointer-events-auto">
        <Link to="/" className={linkClass('/')}>
          <MapPin size={18} strokeWidth={1.5} />
          <span className="text-sm font-bold font-serif tracking-widest">舆图</span>
        </Link>

        <Link to="/list" className={linkClass('/list')}>
          <ScrollText size={18} strokeWidth={1.5} />
          <span className="text-sm font-bold font-serif tracking-widest">画卷</span>
        </Link>

        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-500 border bg-paper/80 text-ink border-indigo/20 hover:bg-indigo/5 hover:border-indigo/40"
        >
          <LogOut size={16} strokeWidth={1.5} />
          <span className="text-sm font-bold font-serif tracking-widest">退出</span>
        </button>
      </div>
    </nav>
  );
};

const Header = () => (
  <header className="fixed top-0 left-0 p-8 z-40 select-none pointer-events-none">
    <div className="flex flex-col items-start drop-shadow-md">
      <div className="bg-cinnabar w-8 h-8 rounded-sm mb-3 flex items-center justify-center text-paper text-sm font-serif shadow-sm pointer-events-auto hover:scale-105 transition-transform">
        绘
      </div>
      <h1 className="font-calligraphy text-5xl text-ink tracking-widest pointer-events-auto">
        绘行中华
      </h1>
      <p className="text-xs text-ashes mt-2 font-serif tracking-[0.3em] border-t border-ashes/30 pt-2 w-full text-center">
        INK FOOTPRINTS
      </p>
    </div>
  </header>
);

const AuthScreen = ({ onAuthenticated }: { onAuthenticated: () => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (mode: 'login' | 'register'): Promise<void> => {
    const trimmedUser = username.trim();
    const validationError = validateAuthInput({ username: trimmedUser, password });
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      if (mode === 'register') {
        await registerAndLogin({ username: trimmedUser, password });
      } else {
        await loginWithPassword({ username: trimmedUser, password });
      }
      onAuthenticated();
    } catch (authError) {
      console.error('Auth failed:', authError);
      setError(authError instanceof Error ? authError.message : '认证失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden flex items-center justify-center px-6">
      <Header />
      <div className="w-full max-w-md rounded-2xl border border-indigo/20 bg-paper/90 shadow-xl p-8 backdrop-blur-sm">
        <h2 className="text-2xl font-serif tracking-widest text-ink mb-2">账号登录</h2>
        <p className="text-sm text-ashes mb-6">登录后可同步你的旅行足迹。</p>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submit('login');
          }}
        >
          <div>
            <label htmlFor="auth-username" className="block text-sm text-ashes mb-1">
              用户名
            </label>
            <input
              id="auth-username"
              data-testid="auth-username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-lg border border-indigo/20 bg-paper px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-cinnabar/40"
              autoComplete="username"
              minLength={AUTH_RULES.username.minLength}
              maxLength={AUTH_RULES.username.maxLength}
              required
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-ashes">
              {`长度 ${AUTH_RULES.username.minLength}-${AUTH_RULES.username.maxLength} 个字符`}
            </p>
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-sm text-ashes mb-1">
              密码
            </label>
            <input
              id="auth-password"
              data-testid="auth-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-indigo/20 bg-paper px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-cinnabar/40"
              autoComplete="current-password"
              minLength={AUTH_RULES.password.minLength}
              maxLength={AUTH_RULES.password.maxLength}
              required
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-ashes">
              {`长度 ${AUTH_RULES.password.minLength}-${AUTH_RULES.password.maxLength} 个字符`}
            </p>
          </div>

          {error ? <p className="text-sm text-cinnabar">{error}</p> : null}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              data-testid="auth-login"
              type="submit"
              disabled={isLoading}
              className="rounded-lg border border-indigo/20 bg-indigo text-paper px-4 py-2 hover:opacity-90 disabled:opacity-60"
            >
              登录
            </button>
            <button
              data-testid="auth-register"
              type="button"
              disabled={isLoading}
              onClick={() => {
                void submit('register');
              }}
              className="rounded-lg border border-cinnabar/30 bg-cinnabar text-paper px-4 py-2 hover:opacity-90 disabled:opacity-60"
            >
              注册并登录
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AppContent = () => {
  const [records, setRecords] = useState<TravelRecord[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(hasAuthToken());
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedRecords, setSelectedRecords] = useState<TravelRecord[]>([]);
  const [isFirstVisit, setIsFirstVisit] = useState(true);

  const handleLogout = useCallback(() => {
    logout();
    setIsAuthenticated(false);
    setRecords([]);
    setIsModalOpen(false);
    setSelectedLocation('');
    setSelectedRecords([]);
  }, []);

  const loadRecords = useCallback(async () => {
    setIsLoadingRecords(true);
    try {
      const apiData = await fetchRecords();
      setRecords(apiData);
    } catch (error) {
      if (error instanceof AuthRequiredError) {
        handleLogout();
        return;
      }
      console.error('Failed to load records:', error);
      alert('加载足迹失败，请稍后重试');
    } finally {
      setIsLoadingRecords(false);
    }
  }, [handleLogout]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadRecords();
  }, [isAuthenticated, loadRecords]);

  const handleSaveRecord = async (record: TravelRecord) => {
    try {
      const existingIndex = records.findIndex((r) => r.id === record.id);

      if (existingIndex >= 0) {
        const updatedRecord = await updateRecord(record.id, record);
        setRecords((prev) => {
          const newRecords = [...prev];
          newRecords[existingIndex] = updatedRecord;
          return newRecords;
        });

        if (selectedLocation === updatedRecord.region) {
          setSelectedRecords((prev) => {
            const idx = prev.findIndex((r) => r.id === updatedRecord.id);
            if (idx >= 0) {
              const newSelected = [...prev];
              newSelected[idx] = updatedRecord;
              return newSelected;
            }
            return prev;
          });
        }
      } else {
        const newRecord = await createRecord(record);
        setRecords((prev) => [newRecord, ...prev]);

        if (selectedLocation === newRecord.region) {
          setSelectedRecords((prev) => [newRecord, ...prev]);
        }
      }

      setIsModalOpen(false);
      setSelectedLocation('');
    } catch (error) {
      if (error instanceof AuthRequiredError) {
        handleLogout();
        return;
      }
      console.error('Failed to save:', error);
      alert('保存失败，请重试');
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      await deleteRecord(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      setSelectedRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      if (error instanceof AuthRequiredError) {
        handleLogout();
        return;
      }
      console.error('Failed to delete:', error);
      alert('删除失败，请重试');
    }
  };

  const handleMapClick = useCallback(
    (locationName: string) => {
      const existingRecords = records.filter((r) => r.region === locationName);
      const hasVisited = existingRecords.length > 0;

      setIsFirstVisit(!hasVisited);
      setSelectedLocation(locationName);
      setSelectedRecords(existingRecords);
      setIsModalOpen(true);
    },
    [records],
  );

  if (!isAuthenticated) {
    return <AuthScreen onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col">
      <Header />
      <Navigation onLogout={handleLogout} />

      <main className="flex-1 relative">
        {isLoadingRecords ? (
          <div className="absolute inset-0 z-30 flex items-center justify-center text-ashes text-sm tracking-widest font-serif">
            正在载入足迹...
          </div>
        ) : null}
        <Routes>
          <Route path="/" element={<InkMap records={records} onMapClick={handleMapClick} />} />
          <Route path="/list" element={<ScrollList records={records} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <RecordModal
        isOpen={isModalOpen}
        initialLocation={selectedLocation}
        existingRecords={selectedRecords}
        isFirstVisit={isFirstVisit}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRecord}
        onDelete={handleDeleteRecord}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;
