export function baseUrl() {
  return `${window.location.protocol}//${window.location.host}`;
}

export function linkCliente(slug) {
  return `${baseUrl()}/loja/${slug}`;
}

export function linkAdmin(slug) {
  return `${baseUrl()}/admin/${slug}`;
}

export function getSlug() {
  // First try path param /loja/:slug
  const pathMatch = window.location.pathname.match(/^\/loja\/([^/]+)/)
  if (pathMatch) return pathMatch[1]

  // Fall back to query param ?loja=xxx
  const params = new URLSearchParams(window.location.search);
  return params.get('loja');
}

export function copiar(texto) {
  return navigator.clipboard.writeText(texto);
}
