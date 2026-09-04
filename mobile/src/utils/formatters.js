export const money = (value = 0) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export const shortDate = (value) => value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const dateTime = (value) => value ? new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';

export const toApiDate = (value) => new Date(value).toISOString();

export const monthName = (month) => new Date(2020, Number(month) - 1, 1).toLocaleString('en-IN', { month: 'long' });

export const progress = (spent, limit) => Math.max(0, Math.min(100, limit > 0 ? (Number(spent) / Number(limit)) * 100 : 0));

export const progressColor = (percent) => percent < 50 ? '#147A5B' : percent <= 85 ? '#B54708' : '#B42318';
