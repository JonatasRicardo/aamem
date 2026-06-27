export function tenantTag(tenant: string) {
  return `tenant:${tenant}`;
}

export function tenantPathTag(tenant: string, path: string) {
  return `tenant:${tenant}:path:${path}`;
}
