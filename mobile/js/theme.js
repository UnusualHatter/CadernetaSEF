// index.html applies the saved theme before first paint; this keeps it in sync.

const KEY = 'agenda-contabil.theme';
const query = window.matchMedia('(prefers-color-scheme: dark)');

export const getPreference = () => {
    try {
        return localStorage.getItem(KEY) || 'auto';
    } catch {
        return 'auto';
    }
};

export function applyTheme() {
    const preference = getPreference();
    const dark = preference === 'dark' || (preference === 'auto' && query.matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#1c1815' : '#f6f1e9');
}

export function setPreference(value) {
    try {
        localStorage.setItem(KEY, value);
    } catch {}
    applyTheme();
}

query.addEventListener('change', applyTheme);
