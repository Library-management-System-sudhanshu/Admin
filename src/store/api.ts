// Compatibility entry point. New features can import their domain module directly.
export { baseApi as api } from './api/baseApi';
export * from './api/auth';
export * from './api/dashboard';
export * from './api/students';
export * from './api/seats';
export * from './api/payments';
export * from './api/library';
export * from './api/complaints';
export * from './api/messaging';
export * from './api/workspaces';
export * from './api/notices';
export * from './api/settings';
export * from './api/subscriptions';
