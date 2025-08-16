// Alias route to support stripe CLI forwarding to /api/stripe/webhook
// Re-exports the existing webhook handler at /api/webhooks/stripe
export { POST } from '@/app/api/webhooks/stripe/route';
