import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe, Mail, MapPin, Phone, Plus, Users } from 'lucide-react';
import { usePermission } from '@/app/hooks';
import { useScopedData, useUserName } from '@/hooks/useScopedData';
import { CUSTOMER_STATUSES, INDUSTRIES, customerStatusMeta } from '@/utils/constants';
import { formatCurrency, relativeTime, safeParse } from '@/utils/format';
import { isOpenDeal } from '@/utils/metrics';
import Avatar from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Feedback';
import { FilterSelect, SearchInput } from '@/components/ui/Field';
import PageHeader from '@/components/ui/PageHeader';
import { Pagination } from '@/components/ui/Pagination';
import CustomerFormModal from './CustomerFormModal';

const PAGE_SIZE = 9;

export default function Customers() {
  const can = usePermission();
  const userName = useUserName();
  const { customers, deals, activities, isManager } = useScopedData();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [industry, setIndustry] = useState('all');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);

  const enriched = useMemo(
    () =>
      customers.map((c) => {
        const cd = deals.filter((d) => d.customerId === c.id);
        const last = activities
          .filter((a) => a.customerId === c.id && (safeParse(a.date)?.getTime() ?? 0) <= Date.now())
          .sort((a, b) => b.date.localeCompare(a.date))[0];
        return {
          customer: c,
          openDeals: cd.filter(isOpenDeal).length,
          lifetime: cd.filter((d) => d.stage === 'won').reduce((s, d) => s + d.value, 0),
          lastContact: last?.date,
        };
      }),
    [customers, deals, activities],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enriched
      .filter(
        ({ customer: c }) =>
          (status === 'all' || c.status === status) &&
          (industry === 'all' || c.industry === industry) &&
          (!q || [c.name, c.company, c.email, c.location].some((v) => v.toLowerCase().includes(q))),
      )
      .sort((a, b) => a.customer.company.localeCompare(b.customer.company));
  }, [enriched, query, status, industry]);

  useEffect(() => setPage(1), [query, status, industry]);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle={isManager ? 'All customer accounts across your team' : 'Accounts you manage'}
        actions={can('customers.create') && <Button icon={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)}>Add customer</Button>}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={query} onChange={setQuery} placeholder="Search customers" className="sm:w-80" />
        <FilterSelect label="Filter by status" value={status} onChange={setStatus} options={[{ value: 'all', label: 'All statuses' }, ...CUSTOMER_STATUSES.map((s) => ({ value: s.value, label: s.label }))]} />
        <FilterSelect label="Filter by industry" value={industry} onChange={setIndustry} options={[{ value: 'all', label: 'All industries' }, ...INDUSTRIES.map((i) => ({ value: i, label: i }))]} />
        <p className="text-sm text-muted sm:ml-auto">{filtered.length} {filtered.length === 1 ? 'customer' : 'customers'}</p>
      </div>

      {pageItems.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title={customers.length ? 'No customers match your filters' : 'No customers yet'}
            description={customers.length ? 'Try a different search or clear the filters.' : 'Convert a lead or add a customer to get started.'}
            action={can('customers.create') && !customers.length ? <Button onClick={() => setFormOpen(true)} icon={<Plus className="h-4 w-4" />}>Add customer</Button> : undefined}
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pageItems.map(({ customer: c, openDeals, lifetime, lastContact }) => {
              const meta = customerStatusMeta(c.status);
              return (
                <Link key={c.id} to={`/customers/${c.id}`} className="group focus:outline-none">
                  <Card className="h-full p-5 transition-all duration-300 group-hover:-translate-y-1.5 group-hover:border-blue-500/50 group-hover:shadow-xl group-hover:shadow-blue-500/10 group-focus-visible:ring-2 group-focus-visible:ring-brand-400">
                    <div className="flex items-start gap-3">
                      <Avatar name={c.company} size={46} className="rounded-xl transition-transform duration-300 group-hover:scale-105" />
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-base font-semibold text-white group-hover:text-blue-300 transition-colors">{c.company}</h2>
                        <p className="truncate text-sm text-muted">{c.name}</p>
                      </div>
                      <Badge tone={meta.tone} dot>{meta.label}</Badge>
                    </div>

                    <ul className="mt-4 space-y-1.5 text-sm text-slate-300">
                      <li className="flex items-center gap-2 truncate"><Mail className="h-4 w-4 shrink-0 text-muted" aria-hidden /> <span className="truncate">{c.email}</span></li>
                      <li className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-muted" aria-hidden /> {c.phone}</li>
                      <li className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-muted" aria-hidden /> {c.location}</li>
                      {c.website && <li className="flex items-center gap-2 truncate"><Globe className="h-4 w-4 shrink-0 text-muted" aria-hidden /> <span className="truncate">{c.website}</span></li>}
                    </ul>

                    <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4 text-center">
                      <div>
                        <p className="text-base font-semibold text-white">{openDeals}</p>
                        <p className="text-[11px] text-muted">Open deals</p>
                      </div>
                      <div>
                        <p className="text-base font-semibold text-white">{formatCurrency(lifetime, true)}</p>
                        <p className="text-[11px] text-muted">Lifetime</p>
                      </div>
                      <div>
                        <p className="truncate text-base font-semibold text-white">{lastContact ? relativeTime(lastContact).replace('about ', '') : '—'}</p>
                        <p className="text-[11px] text-muted">Last contact</p>
                      </div>
                    </div>
                    {isManager && <p className="mt-3 text-xs text-muted">Owner: <span className="text-slate-300">{userName(c.ownerId)}</span></p>}
                  </Card>
                </Link>
              );
            })}
          </div>
          {filtered.length > PAGE_SIZE && (
            <Card className="mt-4 overflow-hidden">
              <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onChange={setPage} />
            </Card>
          )}
        </>
      )}

      <CustomerFormModal open={formOpen} onClose={() => setFormOpen(false)} />
    </>
  );
}
