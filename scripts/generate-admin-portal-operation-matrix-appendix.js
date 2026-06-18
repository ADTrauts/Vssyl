#!/usr/bin/env node
/**
 * Read-only helper: regenerate canonical operation matrix appendix markdown
 * from admin-portal route files. Documentation support only (AP-F-003).
 *
 * Usage: node scripts/generate-admin-portal-operation-matrix-appendix.js
 */
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const files = [
  'server/src/routes/admin-portal/adminPortalRoutes.core.ts',
  'server/src/routes/admin-portal/adminPortalRoutes.analyticsOps.ts',
  'server/src/routes/admin-portal/adminPortalRoutes.platform.ts',
  'server/src/routes/admin-portal/adminPortalRoutes.aiPipeline.ts',
  'server/src/routes/adminSecurityRoutes.ts',
];

const classifyDomain = (file, route) => {
  if (file.includes('core')) {
    if (route.startsWith('/test')) return { domain: 'Developer / Testing', maturity: 'debug gated', cert: 'Advisory' };
    if (route.startsWith('/dashboard')) return { domain: 'System Operations', maturity: 'mock removed', cert: 'Required' };
    if (route.includes('impersonat')) return { domain: 'Impersonation', maturity: 'implemented', cert: 'Required' };
    if (route.startsWith('/users')) return { domain: 'User Management', maturity: 'implemented', cert: 'Required' };
    if (route.startsWith('/moderation')) return { domain: 'Moderation', maturity: 'implemented', cert: 'Required' };
  }
  if (file.includes('analyticsOps')) {
    if (route.startsWith('/analytics')) return { domain: 'Analytics / BI', maturity: 'implemented', cert: 'Required' };
    if (route.startsWith('/billing')) return { domain: 'Billing', maturity: 'implemented', cert: 'Required' };
    if (route.startsWith('/security')) return { domain: 'Security / Compliance', maturity: 'implemented', cert: 'Required' };
    if (route.startsWith('/system')) return { domain: 'System Operations', maturity: 'mock removed', cert: 'Required' };
    if (route.startsWith('/moderation')) return { domain: 'Moderation', maturity: 'implemented', cert: 'Required' };
    if (route.startsWith('/modules')) return { domain: 'Module Governance', maturity: 'mock removed', cert: 'Required' };
  }
  if (file.includes('platform')) {
    if (route.startsWith('/business-intelligence')) return { domain: 'Analytics / BI', maturity: 'implemented', cert: 'Required' };
    if (route.startsWith('/support')) return { domain: 'Support', maturity: 'mock removed', cert: 'Required' };
    if (route.startsWith('/performance')) return { domain: 'System Operations', maturity: 'implemented', cert: 'Advisory' };
    if (route.startsWith('/database')) {
      const gated = route.includes('migrations/delete') || route.includes('reset-baseline');
      return { domain: 'Database Operations', maturity: gated ? 'gated' : 'implemented', cert: 'Required' };
    }
    if (route.startsWith('/integrations')) return { domain: 'System Operations', maturity: 'partial', cert: 'Advisory' };
  }
  if (file.includes('aiPipeline')) return { domain: 'AI Pipeline', maturity: 'implemented', cert: 'Required' };
  if (file.includes('adminSecurityRoutes')) return { domain: 'Security / Compliance', maturity: 'partial', cert: 'Advisory' };
  return { domain: 'Unknown', maturity: 'unknown', cert: 'Deferred' };
};

const re = /router\.(get|post|put|patch|delete)\(\s*[\n\r\s]*['`]([^'`]+)['`]/g;
const rows = [];
let id = 0;

for (const rel of files) {
  const abs = path.join(repoRoot, rel);
  const src = fs.readFileSync(abs, 'utf8');
  const fileShort = path.basename(rel);
  for (const m of src.matchAll(re)) {
    id += 1;
    const method = m[1].toUpperCase();
    const route = m[2];
    const mount = fileShort === 'adminSecurityRoutes.ts' ? '/api/admin-portal/security' : '/api/admin-portal';
    const cls = classifyDomain(fileShort, route);
    const auth = fileShort === 'adminSecurityRoutes.ts'
      ? 'JWT+admin (parent); handler-local auth absent'
      : 'JWT + requireAdmin';
    const notes = [];
    if (route === '/security/events' && fileShort.includes('analyticsOps')) notes.push('Duplicate handler AP-F-015');
    if (route === '/test') notes.push('ADMIN_PORTAL_DEBUG_ENABLED');
    if (route.includes('migrations/delete') || route.includes('reset-baseline')) notes.push('ADMIN_PORTAL_DANGEROUS_OPS_ENABLED');
    rows.push({
      id: `AP-OP-${String(id).padStart(3, '0')}`,
      ...cls,
      surface: 'canonical',
      method,
      route: mount + route,
      file: fileShort,
      auth,
      notes: notes.join('; ') || '—',
    });
  }
}

const order = [
  'User Management', 'Impersonation', 'Support', 'Billing', 'Module Governance', 'Moderation',
  'System Operations', 'Database Operations', 'Security / Compliance', 'Analytics / BI', 'AI Pipeline',
  'Developer / Testing', 'Unknown',
];
const byDomain = {};
for (const r of rows) (byDomain[r.domain] ||= []).push(r);

console.log(`<!-- Generated ${new Date().toISOString().slice(0, 10)} — ${rows.length} canonical operations -->`);
for (const domain of order) {
  const list = byDomain[domain];
  if (!list?.length) continue;
  console.log(`### ${domain} (${list.length})`);
  console.log('');
  console.log('| Operation ID | Domain | Surface | Method | Route | Handler / File | Auth Pattern | Maturity | Owner | Certification Relevance | Notes |');
  console.log('|--------------|--------|---------|--------|-------|----------------|--------------|----------|-------|-------------------------|-------|');
  for (const r of list) {
    console.log(`| ${r.id} | ${r.domain} | ${r.surface} | ${r.method} | \`${r.route}\` | \`${r.file}\` | ${r.auth} | ${r.maturity} | Admin Portal | ${r.cert} | ${r.notes} |`);
  }
  console.log('');
}
