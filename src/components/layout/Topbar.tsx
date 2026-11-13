import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, CheckSquare, LogOut, Menu, Search, Settings, Target, User as UserIcon, Users } from 'lucide-react';
import { useAppDispatch, useAppSelector, useCurrentUser } from '@/app/hooks';
import { logout } from '@/features/authSlice';
import { markAllRead, markRead } from '@/features/notificationsSlice';
import { toggleSidebar } from '@/features/uiSlice';
import { NOTIFICATION_META, ROLE_LABEL } from '@/utils/constants';
import { cn, relativeTime } from '@/utils/format';
import { useScopedData } from '@/hooks/useScopedData';
import Avatar from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';

function useOutsideClose<T extends HTMLElement>(open: boolean, close: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && close();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);
  return ref;
}

function SearchBox({ isMobile }: { isMobile?: boolean }) {
  const navigate = useNavigate();
  const { leads, customers, tasks } = useScopedData();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose<HTMLDivElement>(open, () => setOpen(false));

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) return [];
    const hit = (...vals: string[]) => vals.some((v) => v.toLowerCase().includes(term));
    return [
      ...leads.filter((l) => hit(l.name, l.company, l.email)).slice(0, 3).map((l) => ({ id: l.id, icon: Target, title: l.name, sub: `Lead · ${l.company}`, to: '/leads' })),
      ...customers.filter((c) => hit(c.name, c.company, c.email)).slice(0, 3).map((c) => ({ id: c.id, icon: Users, title: c.company, sub: `Customer · ${c.name}`, to: `/customers/${c.id}` })),
      ...tasks.filter((t) => hit(t.title)).slice(0, 3).map((t) => ({ id: t.id, icon: CheckSquare, title: t.title, sub: 'Task', to: '/tasks' })),
    ];
  }, [q, leads, customers, tasks]);

  return (
    <div ref={ref} className={cn('relative w-full', isMobile ? 'block' : 'hidden md:block max-w-md')}>
      <Search
        className={cn(
          'pointer-events-none absolute top-1/2 -translate-y-1/2',
          isMobile ? 'left-3.5 h-4 w-4 text-slate-400' : 'left-3.5 h-4 w-4 text-muted',
        )}
        aria-hidden
      />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={isMobile ? 'Search for something' : 'Search leads, customers, tasks…'}
        aria-label="Search"
        className={cn(
          'w-full transition-all focus:outline-none',
          isMobile
            ? 'h-10 rounded-full border border-white/10 bg-[#0c162d] py-0 pl-10 pr-4 text-xs text-white placeholder:text-slate-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20'
            : 'field h-10 rounded-full py-0 pl-10 text-sm',
        )}
      />
      {open && q.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-12 z-40 overflow-hidden rounded-2xl border border-line bg-elevated shadow-2xl animate-scale-up">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">No results for “{q}”</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1.5">
              {results.map((r) => (
                <li key={`${r.sub}-${r.id}`}>
                  <button
                    type="button"
                    onClick={() => {
                      navigate(r.to);
                      setOpen(false);
                      setQ('');
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-white/5"
                  >
                    <r.icon className="h-4 w-4 shrink-0 text-brand-300" aria-hidden />
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-white">{r.title}</span>
                      <span className="block truncate text-xs text-muted">{r.sub}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationBell() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const all = useAppSelector((s) => s.notifications.items);
  const mine = useMemo(() => all.filter((n) => n.userId === user.id || n.userId === 'all' || !n.userId), [all, user.id]);
  const unread = mine.filter((n) => !n.read).length;
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose<HTMLDivElement>(open, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-slate-300 transition hover:border-brand-500/50 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-bg">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="fixed inset-x-3 top-[68px] z-40 overflow-hidden rounded-2xl border border-line bg-elevated shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[380px] animate-scale-up">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-white">Notifications</p>
            <button
              type="button"
              disabled={!unread}
              onClick={() => dispatch(markAllRead(user.id))}
              className="text-xs font-medium text-brand-300 transition hover:text-brand-200 disabled:opacity-40"
            >
              Mark all read
            </button>
          </div>
          <ul className="max-h-[360px] overflow-y-auto">
            {mine.slice(0, 6).map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => {
                    dispatch(markRead(n.id));
                    setOpen(false);
                    navigate(n.link ?? '/notifications');
                  }}
                  className="flex w-full items-start gap-3 border-b border-line/60 px-4 py-3 text-left transition hover:bg-white/5"
                >
                  <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-transparent' : 'bg-brand-400')} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-white">{n.title}</span>
                      <span className="shrink-0 text-[11px] text-muted">{relativeTime(n.createdAt)}</span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-xs text-muted">{n.message}</span>
                    <Badge tone={NOTIFICATION_META[n.type].tone} className="mt-1.5">
                      {NOTIFICATION_META[n.type].label}
                    </Badge>
                  </span>
                </button>
              </li>
            ))}
            {mine.length === 0 && <li className="px-4 py-8 text-center text-sm text-muted">You're all caught up.</li>}
          </ul>
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-center text-sm font-medium text-brand-300 transition hover:bg-white/5"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}

function UserMenu({ isMobile }: { isMobile?: boolean }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const all = useAppSelector((s) => s.notifications.items);
  const unread = all.filter((n) => (n.userId === user.id || n.userId === 'all' || !n.userId) && !n.read).length;
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose<HTMLDivElement>(open, () => setOpen(false));

  const signOut = () => {
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'transition focus:outline-none',
          isMobile
            ? 'flex items-center justify-center rounded-full p-[2px] ring-2 ring-teal-500/80 shadow-[0_0_10px_rgba(20,184,166,0.35)] hover:ring-teal-400 active:scale-95'
            : 'flex items-center gap-2.5 rounded-full border border-line bg-surface py-1 pl-1 pr-3 hover:border-brand-500/50 focus-visible:ring-2 focus-visible:ring-brand-400',
        )}
      >
        {isMobile ? (
          <Avatar name={user.name} size={32} />
        ) : (
          <>
            <Avatar name={user.name} size={32} />
            <span className="hidden text-left leading-tight sm:block">
              <span className="block max-w-[120px] truncate text-sm font-medium text-white">{user.name}</span>
              <span className="block text-[11px] text-muted">{ROLE_LABEL[user.role]}</span>
            </span>
          </>
        )}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-12 z-40 w-60 overflow-hidden rounded-2xl border border-line bg-elevated shadow-2xl animate-scale-up">
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-medium text-white">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          <div className="p-1.5">
            <Link role="menuitem" to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-200 transition hover:bg-white/5">
              <UserIcon className="h-4 w-4 text-muted" /> My profile
            </Link>
            <Link role="menuitem" to="/notifications" onClick={() => setOpen(false)} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-200 transition hover:bg-white/5 md:hidden">
              <span className="flex items-center gap-2.5">
                <Bell className="h-4 w-4 text-muted" /> Notifications
              </span>
              {unread > 0 && (
                <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </Link>
            <Link role="menuitem" to="/profile?tab=security" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-200 transition hover:bg-white/5">
              <Settings className="h-4 w-4 text-muted" /> Account settings
            </Link>
            <button role="menuitem" type="button" onClick={signOut} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-rose-300 transition hover:bg-rose-500/10">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getPageTitle(path: string): string {
  if (path === '/' || path === '') return 'Overview';
  if (path.startsWith('/leads')) return 'Leads';
  if (path.startsWith('/pipeline')) return 'Pipeline';
  if (path.startsWith('/customers')) return 'Customers';
  if (path.startsWith('/tasks')) return 'Tasks';
  if (path.startsWith('/activities')) return 'Activities';
  if (path.startsWith('/reports')) return 'Reports';
  if (path.startsWith('/notifications')) return 'Notifications';
  if (path.startsWith('/profile')) return 'Profile';
  return 'Overview';
}

export default function Topbar() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const title = useMemo(() => getPageTitle(location.pathname), [location.pathname]);

  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-line bg-bg/90 backdrop-blur-xl">
      {/* MOBILE LAYOUT (< md) - Matches the reference image layout */}
      <div className="md:hidden flex flex-col px-4 pt-3 pb-3 gap-2.5">
        {/* Row 1: Hamburger Menu (left), Page Title "Overview" (center), Avatar with Teal Ring (right) */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => dispatch(toggleSidebar(true))}
            className="p-1 -ml-1 text-white hover:text-blue-400 transition-colors focus:outline-none"
          >
            <Menu className="h-6 w-6" strokeWidth={2.2} />
          </button>

          <h1 className="text-lg font-bold tracking-tight text-white select-none">
            {title}
          </h1>

          <div className="flex items-center gap-1.5">
            <NotificationBell />
            <UserMenu isMobile />
          </div>
        </div>

        {/* Row 2: Full-width Pill Search Bar with "Search for something" */}
        <div className="w-full">
          <SearchBox isMobile />
        </div>
      </div>

      {/* DESKTOP LAYOUT (>= md) */}
      <div className="hidden md:flex h-16 items-center gap-3 px-6 lg:px-8">
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => dispatch(toggleSidebar(true))}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-slate-300 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <SearchBox />

        <div className="ml-auto flex items-center gap-2.5">
          <NotificationBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
