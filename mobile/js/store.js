// The only place that knows where the data lives: localStorage for now.
// With the server, this and domain.js are what get replaced by /api/v1 calls.

import { buildSeed } from './seed.js';
import { dayKey } from './util.js';

const DATA_KEY = 'agenda-contabil.demo.v1';
const SESSION_KEY = 'agenda-contabil.session.v1';

const read = (key) => {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
};

const write = (key, value) => {
    try {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
    } catch {
        // Private mode or full storage: keep going from memory.
    }
};

const load = () => {
    const raw = read(DATA_KEY);
    if (raw) {
        try {
            const saved = JSON.parse(raw);
            // Untouched demo data from another day is rebuilt, so today is never empty.
            const stale = !saved.meta.edited && saved.meta.seededOn !== dayKey(Date.now());
            if (saved.version === 1 && !stale) return saved;
        } catch {}
    }
    const fresh = buildSeed();
    write(DATA_KEY, JSON.stringify(fresh));
    return fresh;
};

let state = load();
let userId = Number(read(SESSION_KEY)) || null;
const listeners = new Set();

const persist = () => write(DATA_KEY, JSON.stringify(state));

export const store = {
    get state() {
        return state;
    },

    get user() {
        return state.users.find((u) => u.id === userId && u.active) ?? null;
    },

    subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },

    /** Runs a domain function against the state, saves, and tells the views. */
    commit(mutation) {
        const result = mutation(state, this.user);
        persist();
        listeners.forEach((listener) => listener());
        return result;
    },

    login(email, password) {
        const user = state.users.find((u) => u.email === email.trim().toLowerCase() && u.active);
        if (!user || password !== 'password') return null;
        userId = user.id;
        write(SESSION_KEY, String(user.id));
        return user;
    },

    /** Demo only: shows how each profile sees the app. */
    switchUser(id) {
        userId = id;
        write(SESSION_KEY, String(id));
        listeners.forEach((listener) => listener());
    },

    logout() {
        userId = null;
        write(SESSION_KEY, null);
    },

    reset() {
        state = buildSeed();
        persist();
        listeners.forEach((listener) => listener());
    },
};
