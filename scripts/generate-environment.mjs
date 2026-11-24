import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2];
if (!['development', 'production'].includes(mode))
  throw new Error('Use development or production');

// Local overrides contain public client settings only. CI variables win.
const localFile = resolve(project, '.env.local');
const publicKeys = new Set(['API_GATEWAY_URL', 'ENTRA_TENANT_ID', 'ENTRA_SPA_CLIENT_ID',
  'ENTRA_API_APP_ID_URI', 'SPA_BASE_URL', 'API_MANAGER_CONSOLE_URL',
  'RABBITMQ_CONSOLE_URL', 'KAFKA_CONSOLE_URL']);
if (existsSync(localFile)) {
  for (const line of readFileSync(localFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)=(.*)\s*$/);
    if (match && publicKeys.has(match[1]) && process.env[match[1]] === undefined)
      process.env[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, '$2');
  }
}

const required = ['API_GATEWAY_URL', 'ENTRA_TENANT_ID', 'ENTRA_SPA_CLIENT_ID',
  'ENTRA_API_APP_ID_URI', 'SPA_BASE_URL'];
const missing = required.filter(name => !process.env[name]?.trim());
if (missing.length) throw new Error(`Missing public build settings: ${missing.join(', ')}`);

const strip = value => value.trim().replace(/\/+$/, '');
const gateway = strip(process.env.API_GATEWAY_URL);
const base = strip(process.env.SPA_BASE_URL);
const tenant = process.env.ENTRA_TENANT_ID.trim();
const client = process.env.ENTRA_SPA_CLIENT_ID.trim();
const apiUri = strip(process.env.ENTRA_API_APP_ID_URI);
if (!/^https:\/\//.test(gateway) && !(mode === 'development' && /^http:\/\/localhost(?::\d+)?$/.test(gateway)))
  throw new Error('API_GATEWAY_URL must be HTTPS (or local HTTP in development)');
if (!/^https?:\/\//.test(base) || !/^[0-9a-f-]{36}$/i.test(tenant) || !/^[0-9a-f-]{36}$/i.test(client)
    || !/^(api:\/\/|https:\/\/)/.test(apiUri))
  throw new Error('Invalid SPA_BASE_URL, Entra IDs, or ENTRA_API_APP_ID_URI');
if (mode === 'production' && !base.startsWith('https://'))
  throw new Error('SPA_BASE_URL must use HTTPS in production');
if (gateway.endsWith('/api')) throw new Error('API_GATEWAY_URL must exclude /api');

const json = value => JSON.stringify(value);
for (const targetMode of ['development', 'production']) {
const target = resolve(project, 'src/environments',
  targetMode === 'production' ? 'environment.prod.generated.ts' : 'environment.generated.ts');
const source = `// Generated at build time. Public values; do not place secrets here.\n` +
`export const environment = {\n` +
`  production: ${targetMode === 'production'},\n` +
`  apiBaseUrl: ${json(gateway)},\n` +
`  msalConfig: {\n` +
`    clientId: ${json(client)},\n` +
`    tenantId: ${json(tenant)},\n` +
`    authority: ${json(`https://login.microsoftonline.com/${tenant}`)},\n` +
`    redirectUri: ${json(`${base}/auth/callback`)},\n` +
`    postLogoutRedirectUri: ${json(`${base}/login`)},\n` +
`  },\n` +
`  apiConfig: { scopes: [${json(`${apiUri}/pedidos.read`)}, ${json(`${apiUri}/pedidos.write`)}] },\n` +
`  reportsPollingMs: 30000,\n` +
`  healthServices: [\n` +
`    { key: 'orders', label: 'ms-pedidos360-orders' },\n` +
`    { key: 'products', label: 'ms-pedidos360-products' },\n` +
`    { key: 'report', label: 'ms-pedidos360-report' },\n` +
`    { key: 'audit', label: 'ms-pedidos360-audit' },\n` +
`  ],\n` +
`  consoles: { apiManager: ${json(process.env.API_MANAGER_CONSOLE_URL ?? '')}, ` +
`identity: 'https://entra.microsoft.com', rabbitMq: ${json(process.env.RABBITMQ_CONSOLE_URL ?? '')}, ` +
`kafka: ${json(process.env.KAFKA_CONSOLE_URL ?? '')} },\n` +
`  jwtInspectorUrl: 'https://jwt.ms',\n` +
`};\n`;
writeFileSync(target, source);
}
console.log(`Generated public environments for ${mode}`);
