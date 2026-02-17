// js/cache.js
const CACHE_KEYS = {
    USER_PROFILE: 'luxe_user_profile',
    USER_POSTS: 'luxe_user_posts',
    PUBLIC_POSTS: 'luxe_public_posts'
};

const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

function setCache(key, data) {
    const cacheEntry = { data: data, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(cacheEntry));
}

function getCache(key, maxAge = CACHE_EXPIRY) {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp > maxAge) {
            localStorage.removeItem(key);
            return null;
        }
        return data;
    } catch (e) {
        localStorage.removeItem(key);
        return null;
    }
}

function clearCache(key) { localStorage.removeItem(key); }
function clearAllCaches() { Object.values(CACHE_KEYS).forEach(k => localStorage.removeItem(k)); }

function getUserProfile() { return getCache(CACHE_KEYS.USER_PROFILE); }
function setUserProfile(profile) { setCache(CACHE_KEYS.USER_PROFILE, profile); }
function getUserPosts() { return getCache(CACHE_KEYS.USER_POSTS); }
function setUserPosts(posts) { setCache(CACHE_KEYS.USER_POSTS, posts); }
function getPublicPosts() { return getCache(CACHE_KEYS.PUBLIC_POSTS); }
function setPublicPosts(posts) { setCache(CACHE_KEYS.PUBLIC_POSTS, posts); }
