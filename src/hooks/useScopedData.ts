import { useMemo } from 'react';
import { useAppSelector, useCurrentUser } from '@/app/hooks';

/**
 * Role-aware data scope.
 *  - managers see the whole team's records
 *  - sales reps and employees see only records they own
 * Pass `{ onlyMine: true }` to force a personal view (used by the Reports "My performance" toggle).
 */
export function useScopedData(options: { onlyMine?: boolean } = {}) {
  const user = useCurrentUser();
  const users = useAppSelector((s) => s.auth.users);
  const leads = useAppSelector((s) => s.leads.items);
  const deals = useAppSelector((s) => s.deals.items);
  const customers = useAppSelector((s) => s.customers.items);
  const tasks = useAppSelector((s) => s.tasks.items);
  const activities = useAppSelector((s) => s.activities.items);

  const isManager = user.role === 'manager';
  const team = isManager && !options.onlyMine;

  return useMemo(() => {
    const scope = <T extends { ownerId: string }>(items: T[]) => (team ? items : items.filter((i) => i.ownerId === user.id));
    return {
      user,
      users,
      isManager,
      isTeamView: team,
      leads: scope(leads),
      deals: scope(deals),
      customers: scope(customers),
      tasks: scope(tasks),
      activities: scope(activities),
    };
  }, [user, users, isManager, team, leads, deals, customers, tasks, activities]);
}

export const useUserName = () => {
  const users = useAppSelector((s) => s.auth.users);
  return (id?: string) => users.find((u) => u.id === id)?.name ?? 'Unassigned';
};
