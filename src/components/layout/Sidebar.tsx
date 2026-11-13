import { Link, NavLink } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Bell,
  CheckSquare,
  Kanban,
  LayoutDashboard,
  Settings,
  Target,
  Users,
  X,
} from 'lucide-react';
import { useAppDispatch, useAppSelector, useCurrentUser } from '@/app/hooks';
import { toggleSidebar } from '@/features/uiSlice';
import { cn } from '@/utils/format';
import { ROLE_LABEL } from '@/utils/constants';
import Avatar from '@/components/ui/Avatar';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/leads', label: 'Leads', icon: Target },
  { to: '/pipeline', label: 'Sales Pipeline', icon: Kanban },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/activities', label: 'Activities', icon: Activity },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/notifications', label: 'Notifications', icon: Bell, badge: true },
  { to: '/profile', label: 'Profile & Settings', icon: Settings },
];

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn('flex items-center gap-3 group transition-opacity hover:opacity-90', className)}>
      <img
        src="/images/dashboard-logo.png"
        alt="Enterprise CRM Dashboard"
        className="h-10 w-10 rounded-xl object-cover shadow-[0_0_15px_rgba(56,189,248,0.35)] border border-blue-500/30 group-hover:border-blue-400/60 transition-colors"
      />
      <div className="leading-tight">
        <p className="text-[15px] font-bold tracking-tight text-white">
          Enterprise <span className="text-blue-500">CRM</span>
        </p>
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-blue-400">
          Dashboard
        </p>
      </div>
    </Link>
  );
}

export default function Sidebar() {
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.ui.sidebarOpen);
  const user = useCurrentUser();
  const unread = useAppSelector(
    (s) => s.notifications.items.filter((n) => (n.userId === user.id || n.userId === 'all' || !n.userId) && !n.read).length,
  );
  const close = () => dispatch(toggleSidebar(false));

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden" onClick={close} aria-hidden />}
      <aside
        aria-label="Primary"
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-line bg-surface/95 backdrop-blur transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <Logo />
          <button type="button" onClick={close} aria-label="Close menu" className="rounded-lg p-1.5 text-muted hover:text-white lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted/80">Workspace</p>
          {NAV.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={close}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:translate-x-1',
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/25 to-blue-500/10 text-white font-semibold shadow-sm border border-blue-500/25'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute -left-3 top-2 bottom-2 w-1.5 rounded-r-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" aria-hidden />}
                  <Icon className={cn('h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110', isActive ? 'text-blue-400' : 'text-muted group-hover:text-slate-200')} aria-hidden />
                  <span className="flex-1">{label}</span>
                  {badge && unread > 0 && (
                    <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-semibold text-white shadow-[0_0_8px_rgba(37,99,235,0.6)]">{unread}</span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-line p-4">
          <Link to="/profile" className="flex items-center gap-3 rounded-xl bg-elevated/60 p-3 hover:bg-elevated transition-all duration-200 hover:shadow-md border border-transparent hover:border-blue-500/30 group">
            <Avatar name={user.name} size={38} className="group-hover:scale-105 transition-transform" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white group-hover:text-blue-300 transition-colors">{user.name}</p>
              <p className="truncate text-xs text-muted">{ROLE_LABEL[user.role]}</p>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
