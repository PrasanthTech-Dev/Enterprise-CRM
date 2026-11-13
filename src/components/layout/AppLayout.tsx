import { Suspense, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { bootstrap } from '@/app/bootstrap';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { toggleSidebar } from '@/features/uiSlice';
import { ErrorState, Skeleton } from '@/components/ui/Feedback';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading page">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[118px] rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Skeleton className="h-80 rounded-2xl xl:col-span-2" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}

export default function AppLayout() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.ui.dataStatus);
  const error = useAppSelector((s) => s.ui.dataError);
  const { pathname } = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'idle') dispatch(bootstrap());
  }, [status, dispatch]);

  useEffect(() => {
    dispatch(toggleSidebar(false));
    scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname, dispatch]);

  return (
    <div className="fixed inset-0 flex h-screen w-screen overflow-hidden bg-bg">
      <Sidebar />
      <div className="flex flex-1 flex-col h-full min-w-0 overflow-hidden lg:pl-72">
        <Topbar />
        <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
          <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {status === 'error' ? (
              <ErrorState message={error ?? 'Please check your connection and try again.'} onRetry={() => dispatch(bootstrap())} />
            ) : status === 'ready' ? (
              <Suspense fallback={<PageSkeleton />}>
                <div key={pathname} className="animate-fade-in">
                  <Outlet />
                </div>
              </Suspense>
            ) : (
              <PageSkeleton />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
