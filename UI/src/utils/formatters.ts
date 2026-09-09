export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function getStatusBadgeClass(status: string): string {
  const s = status.toUpperCase();
  switch (s) {
    case 'ACTIVE':
    case 'ONLINE':
    case 'IN_STOCK':
    case 'COMPLETED':
    case 'PRESENT':
    case 'PAID':
    case 'APPROVED':
    case 'RUNNING':
    case 'RESOLVED':
    case 'DELIVERED':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';

    case 'IN_PROGRESS':
    case 'ASSIGNED':
    case 'BUSY':
    case 'PROCESSING':
    case 'PICKED':
      return 'bg-blue-500/15 text-blue-400 border-blue-500/30';

    case 'PENDING':
    case 'LOW_STOCK':
    case 'WARNING':
    case 'HALF_DAY':
    case 'LATE':
    case 'CHARGING':
    case 'DRAFT':
    case 'UNPAID':
    case 'ACKNOWLEDGED':
    case 'PLANNED':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';

    case 'OUT_OF_STOCK':
    case 'CRITICAL':
    case 'ERROR':
    case 'OFFLINE':
    case 'CANCELLED':
    case 'TERMINATED':
    case 'OVERDUE':
    case 'REJECTED':
    case 'ABSENT':
    case 'DEFECTIVE':
    case 'SUSPENDED':
      return 'bg-rose-500/15 text-rose-400 border-rose-500/30';

    case 'MAINTENANCE':
    case 'ON_LEAVE':
    case 'IDLE':
    case 'INACTIVE':
    case 'CREATED':
    default:
      return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
  }
}
