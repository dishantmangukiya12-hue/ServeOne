type StatusClasses = {
  bg: string;
  text: string;
  border: string;
};

const statusMap: Record<string, StatusClasses> = {
  active: { bg: 'bg-info/10', text: 'text-info', border: 'border-info' },
  new: { bg: 'bg-info/10', text: 'text-info', border: 'border-info' },
  preparing: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning' },
  ready: { bg: 'bg-success/10', text: 'text-primary', border: 'border-primary' },
  served: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
  closed: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
  cancelled: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive' },
  pending_payment: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning' },
  pending: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning' },
  completed: { bg: 'bg-success/10', text: 'text-primary', border: 'border-primary' },
  paid: { bg: 'bg-success/10', text: 'text-primary', border: 'border-primary' },
};

const defaultStatus: StatusClasses = {
  bg: 'bg-muted',
  text: 'text-muted-foreground',
  border: 'border-border',
};

export function getStatusClasses(status: string): StatusClasses {
  return statusMap[status.toLowerCase()] ?? defaultStatus;
}
