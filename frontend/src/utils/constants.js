export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://vibe-pu1b.onrender.com';
export const API_URL = `${API_BASE_URL}/api`;

export const resolveUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${cleanPath}`;
};
