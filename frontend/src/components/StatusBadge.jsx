// src/components/StatusBadge.jsx
// One shared component for every status pill in the app (quotation
// request, quotation, order, and payment statuses). Uses the badge
// colors from the locked design system.

const STATUS_STYLES = {
  // Quotation request
  PENDING: 'badge-neutral',

  // Quotation / Quotation request "CONVERTED"
  SENT: 'badge-info',
  ACCEPTED: 'badge-success',
  REJECTED: 'badge-error',
  EXPIRED: 'badge-neutral',
  CONVERTED: 'badge-info',

  // Order
  CREATED: 'badge-info',
  PROCESSING: 'badge-warning',
  COMPLETED: 'badge-success',
  CANCELLED: 'badge-error',

  // Payment
  UNPAID: 'badge-warning',
  FULLY_PAID: 'badge-success'
};

export default function StatusBadge({ status }) {
  const className = STATUS_STYLES[status] || 'badge-neutral';
  return <span className={`badge ${className}`}>{status}</span>;
}