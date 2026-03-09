// js/app.js – with delta updates and cache-first strategy
console.log('✅ app.js loaded');

const CACHE_KEY = 'luxe_public_posts';
const LAST_FETCH_KEY = 'luxe_last_fetch';

class EscortDirectory {
    constructor() {
        this.fallbackPosts = JSON.parse(localStorage.getItem('luxePosts')) || [];
        this.allPosts = [];
        this.currentCountry = '';
        this.currentState = '';
        this.currentCity = '';
        document.addEventListener('DOMContentLoaded', () => this.init());
    }

    init() {
        this.loadListings();
        this.setupFilterListeners();
        this.setupEventListeners();
    }

    setupFilterListeners() {
        const countrySelect = document.getElementById('countryFilter');
        const stateSelect = document.getElementById('stateFilter');
        const citySelect = document.getElementById('cityFilter');

        if (countrySelect) {
            countrySelect.addEventListener('change', (e) => {
                this.currentCountry = e.target.value;
                this.currentState = '';
                this.currentCity = '';
                this.updateStateOptions();
                this.displayFilteredPosts();
            });
        }
        if (stateSelect) {
            stateSelect.addEventListener('change', (e) => {
                this.currentState = e.target.value;
                this.currentCity = '';
                this.updateCityOptions();
                this.displayFilteredPosts();
            });
        }
        if (citySelect) {
            citySelect.addEventListener('change', (e) => {
                this.currentCity = e.target.value;
                this.displayFilteredPosts();
            });
        }
    }

    updateStateOptions() {
        const stateSelect = document.getElementById('stateFilter');
        if (!stateSelect) return;
        if (!this.currentCountry) {
            stateSelect.innerHTML = '<option value="">All</option>';
            stateSelect.disabled = true;
            return;
        }
        const states = [...new Set(this.allPosts
            .filter(p => p.location?.country === this.currentCountry)
            .map(p => p.location?.region)
            .filter(r => r && r.trim() !== '')
        )].sort();
        stateSelect.innerHTML = '<option value="">All</option>';
        states.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s;
            opt.textContent = s;
            stateSelect.appendChild(opt);
        });
        stateSelect.disabled = false;
    }

    updateCityOptions() {
        const citySelect = document.getElementById('cityFilter');
        if (!citySelect) return;
        if (!this.currentState) {
            citySelect.innerHTML = '<option value="">All</option>';
            citySelect.disabled = true;
            return;
        }
        const cities = [...new Set(this.allPosts
            .filter(p => p.location?.country === this.currentCountry && p.location?.region === this.currentState)
            .map(p => p.location?.city)
            .filter(c => c && c.trim() !== '')
        )].sort();
        citySelect.innerHTML = '<option value="">All</option>';
        cities.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = c;
            citySelect.appendChild(opt);
        });
        citySelect.disabled = false;
    }

    async loadListings() {
        const vipContainer = document.getElementById('vip-listings');
        const regularContainer = document.getElementById('regular-listings');
        if (!vipContainer && !regularContainer) return;

        if (vipContainer) vipContainer.innerHTML = '<div class="loading">Loading VIP listings...</div>';
        if (regularContainer) regularContainer.innerHTML = '<div class="loading">Loading regular listings...</div>';

        // Try to load from cache
        const cached = this.getCachedPosts();
        if (cached) {
            this.allPosts = cached;
            this.populateCountryFilter();
            this.displayFilteredPosts();
            // Fetch updates in background
            this.fetchUpdates();
        } else {
            // No cache – do full refresh
            await this.fullRefresh();
        }
    }

    getCachedPosts() {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return null;
        try {
            const { posts, timestamp } = JSON.parse(cached);
            // Cache expiry: 1 hour (adjust as needed)
            if (Date.now() - timestamp > 60 * 60 * 1000) {
                localStorage.removeItem(CACHE_KEY);
                localStorage.removeItem(LAST_FETCH_KEY);
                return null;
            }
            return posts;
        } catch {
            return null;
        }
    }

    setCachedPosts(posts) {
        const cacheEntry = {
            posts,
            timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry));
    }

    async fetchUpdates() {
        const lastFetch = localStorage.getItem(LAST_FETCH_KEY);
        if (!lastFetch) {
            // No lastFetch – do full refresh
            await this.fullRefresh();
            return;
        }

        try {
            const response = await fetch('https://carused-mooo-com.vercel.app/api/get-updates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lastFetch })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            // Merge updates into allPosts
            let updated = [...this.allPosts];

            // Remove deleted posts
            if (data.deleted && data.deleted.length) {
                updated = updated.filter(p => !data.deleted.includes(p.id));
            }

            // Add/update new posts
            if (data.posts && data.posts.length) {
                // Remove existing versions of updated posts
                const newIds = data.posts.map(p => p.id);
                updated = updated.filter(p => !newIds.includes(p.id));
                updated = [...updated, ...data.posts];
            }

            // Sort by created_at descending
            updated.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            this.allPosts = updated;
            this.setCachedPosts(updated);
            localStorage.setItem(LAST_FETCH_KEY, new Date().toISOString());

            this.populateCountryFilter();
            this.displayFilteredPosts();
        } catch (err) {
            console.error('Update fetch failed, falling back to full refresh', err);
            await this.fullRefresh();
        }
    }

    async fullRefresh() {
        try {
            if (!window.supabase || typeof window.supabase.from !== 'function') {
                console.warn('Supabase not available, using fallback');
                this.displayFallback();
                return;
            }

            let posts = null;
            let error = null;
            // Attempt join with profiles (optional)
            try {
                const { data, error: err } = await window.supabase
                    .from('posts')
                    .select('*, profiles(username)')
                    .eq('status', 'active')
                    .order('created_at', { ascending: false });
                posts = data;
                error = err;
            } catch (joinErr) {
                console.warn('Join query failed, trying without join:', joinErr);
            }

            if (error || !posts) {
                console.warn('Falling back to basic posts query');
                const { data, error: err } = await window.supabase
                    .from('posts')
                    .select('*')
                    .eq('status', 'active')
                    .order('created_at', { ascending: false });
                posts = data;
                error = err;
            }

            if (error) {
                console.error('Supabase error:', error);
                this.displayFallback();
                return;
            }

            if (!posts || posts.length === 0) {
                this.displayNoPosts();
                return;
            }

            this.allPosts = posts;
            this.setCachedPosts(posts);
            localStorage.setItem(LAST_FETCH_KEY, new Date().toISOString());

            this.populateCountryFilter();
            this.displayFilteredPosts();
        } catch (err) {
            console.error('Unexpected error in fullRefresh:', err);
            this.displayFallback();
        }
    }

    populateCountryFilter() {
        const countrySelect = document.getElementById('countryFilter');
        if (!countrySelect) return;
        const countries = [...new Set(this.allPosts
            .map(p => p.location?.country)
            .filter(c => c && c.trim() !== '')
        )].sort();
        countrySelect.innerHTML = '<option value="">All Countries</option>';
        countries.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = c;
            countrySelect.appendChild(opt);
        });
    }

    displayFilteredPosts() {
        let filtered = this.allPosts;
        if (this.currentCountry) {
            filtered = filtered.filter(p => p.location?.country === this.currentCountry);
        }
        if (this.currentState) {
            filtered = filtered.filter(p => p.location?.region === this.currentState);
        }
        if (this.currentCity) {
            filtered = filtered.filter(p => p.location?.city === this.currentCity);
        }

        const vipContainer = document.getElementById('vip-listings');
        const regularContainer = document.getElementById('regular-listings');
        this.displayPosts(filtered, vipContainer, regularContainer);
    }

    displayPosts(posts, vipContainer, regularContainer) {
        const vipPosts = posts.filter(p => p.is_vip === true);
        const regularPosts = posts.filter(p => p.is_vip !== true);

        if (vipContainer) {
            vipContainer.innerHTML = '';
            if (vipPosts.length > 0) {
                vipPosts.slice(0, 6).forEach(p => vipContainer.appendChild(this.createPostCard(p)));
            } else {
                vipContainer.innerHTML = '<div class="no-listings">No VIP listings yet</div>';
            }
        }

        if (regularContainer) {
            regularContainer.innerHTML = '';
            if (regularPosts.length > 0) {
                regularPosts.slice(0, 12).forEach(p => regularContainer.appendChild(this.createPostCard(p)));
            } else {
                regularContainer.innerHTML = '<div class="no-listings">No regular listings yet</div>';
            }
        }
    }

    displayFallback() {
        const vipContainer = document.getElementById('vip-listings');
        const regularContainer = document.getElementById('regular-listings');
        const vipFallback = this.fallbackPosts.filter(p => p.subscriptionType === 'vip' && p.status === 'active');
        const regularFallback = this.fallbackPosts.filter(p => p.subscriptionType === 'regular' && p.status === 'active');

        if (vipContainer) {
            vipContainer.innerHTML = '';
            if (vipFallback.length > 0) {
                vipFallback.slice(0, 6).forEach(p => vipContainer.appendChild(this.createPostCard(p)));
            } else {
                vipContainer.innerHTML = '<div class="no-listings">No VIP listings (demo mode)</div>';
            }
        }

        if (regularContainer) {
            regularContainer.innerHTML = '';
            if (regularFallback.length > 0) {
                regularFallback.slice(0, 12).forEach(p => regularContainer.appendChild(this.createPostCard(p)));
            } else {
                regularContainer.innerHTML = '<div class="no-listings">No regular listings (demo mode)</div>';
            }
        }
    }

    displayNoPosts() {
        const vipContainer = document.getElementById('vip-listings');
        const regularContainer = document.getElementById('regular-listings');
        if (vipContainer) vipContainer.innerHTML = '<div class="no-listings">No VIP listings yet</div>';
        if (regularContainer) regularContainer.innerHTML = '<div class="no-listings">No regular listings yet</div>';
    }

    createPostCard(post) {
        const card = document.createElement('div');
        card.className = `listing-card ${post.is_vip ? 'vip-card' : ''}`;
        card.addEventListener('click', () => {
            window.location.href = `post.html?id=${post.id}`;
        });
        card.style.cursor = 'pointer';

        const title = post.title || (post.is_vip ? 'VIP Companion' : 'Companion');
        const desc = post.description || 'No description provided.';
        const imageUrl = (post.images && post.images[0]) ? post.images[0] : 'images/default-avatar.jpg';
        const username = post.profiles?.username || post.username || (post.user_id ? 'User' : 'Anonymous');

        // Build location string (city, region, country) if available
        let locationText = '';
        if (post.location?.city && post.location?.region && post.location?.country) {
            locationText = `${post.location.city}, ${post.location.region}, ${post.location.country}`;
        } else if (post.location?.city && post.location?.country) {
            locationText = `${post.location.city}, ${post.location.country}`;
        } else if (post.location?.country) {
            locationText = post.location.country;
        }
        const locationHtml = locationText ? `<span><i class="fas fa-map-marker-alt"></i> ${this.escapeHtml(locationText)}</span>` : '';

        card.innerHTML = `
            ${post.is_vip ? '<div class="vip-badge"><i class="fas fa-crown"></i> VIP</div>' : ''}
            <img src="${imageUrl}" class="listing-image" onerror="this.src='images/default-avatar.jpg'">
            <div class="listing-content">
                <h3>${this.escapeHtml(title.substring(0, 50))}</h3>
                <p class="listing-description">${this.escapeHtml(desc.substring(0, 100))}...</p>
                ${locationHtml}
            </div>
        `;
        return card;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    setupEventListeners() {}
}

const app = new EscortDirectory();
