export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
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
      return 'bg-emerald-50 text-emerald-800 border-emerald-200/90 font-semibold shadow-xs';

    case 'IN_PROGRESS':
    case 'ASSIGNED':
    case 'BUSY':
    case 'PROCESSING':
    case 'PICKED':
      return 'bg-blue-50 text-blue-800 border-blue-200/90 font-semibold shadow-xs';

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
      return 'bg-amber-50 text-amber-900 border-amber-200/90 font-semibold shadow-xs';

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
      return 'bg-rose-50 text-rose-800 border-rose-200/90 font-semibold shadow-xs';

    case 'MAINTENANCE':
    case 'ON_LEAVE':
    case 'IDLE':
    case 'INACTIVE':
    case 'CREATED':
    default:
      return 'bg-stone-100 text-stone-700 border-stone-200/90 font-semibold shadow-xs';
  }
}
