// js/app.js – with cache‑first and background refresh
console.log('✅ app.js loaded');

class EscortDirectory {
    constructor() {
        this.fallbackPosts = JSON.parse(localStorage.getItem('luxePosts')) || [];
        this.allPosts = [];               // store all fetched posts (for filtering)
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

        // 🔁 Try cache first
        const cachedPosts = (typeof getPublicPosts === 'function') ? getPublicPosts() : null;
        if (cachedPosts && cachedPosts.length > 0) {
            this.allPosts = cachedPosts;
            this.populateCountryFilter();
            this.displayFilteredPosts();
            // Refresh in background (fetch new posts and update cache)
            this.refreshListings();
        } else {
            await this.refreshListings();
        }
    }

    async refreshListings() {
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

            // Update allPosts and cache
            this.allPosts = posts;
            if (typeof setPublicPosts === 'function') setPublicPosts(posts);
            this.populateCountryFilter();
            this.displayFilteredPosts();
        } catch (err) {
            console.error('Unexpected error in refreshListings:', err);
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
