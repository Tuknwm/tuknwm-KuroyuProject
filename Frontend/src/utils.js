const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function imgUrl(path) {
  if (!path) return path;
  if (path.startsWith('/uploads/')) return `${API}${path}`;
  return path;
}
