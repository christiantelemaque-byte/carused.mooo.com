// js/app.js – With caching for public posts
console.log('✅ app.js loaded');

class EscortDirectory {
    constructor() {
        this.posts = JSON.parse(localStorage.getItem('luxePosts')) || [];
        document.addEventListener('DOMContentLoaded', () => this.init());
    }

    init() {
        this.loadListings();
        this.setupEventListeners();
    }

    async loadListings() {
        const vipListings = document.getElementById('vip-listings');
        const regularListings = document.getElementById('regular-listings');
        if (!vipListings && !regularListings) return;

        // Clear loading messages
        if (vipListings) vipListings.innerHTML = '';
        if (regularListings) regularListings.innerHTML = '';

        // Try to load from cache first
        const cachedPosts = getPublicPosts();
        if (cachedPosts) {
            this.displayPosts(cachedPosts, vipListings, regularListings);
            // Then refresh in background
            this.refreshListings(vipListings, regularListings);
        } else {
            // No cache, load directly from DB
            await this.refreshListings(vipListings, regularListings);
        }
    }

    async refreshListings(vipContainer, regularContainer) {
        try {
            if (window.supabase && window.supabase.from) {
                const { data: posts, error } = await window.supabase
                    .from('posts')
                    .select('*')
                    .eq('status', 'active')
                    .order('created_at', { ascending: false });
                
                if (!error && posts) {
                    // Cache the fresh data
                    setPublicPosts(posts);
                    // Update display (overwrites previous)
                    this.displayPosts(posts, vipContainer, regularContainer);
                    return;
                }
            }
            // Fallback to local storage
            this.displayLocalPosts(vipContainer, regularContainer);
        } catch (error) {
            console.error('Error loading listings:', error);
            this.displayLocalPosts(vipContainer, regularContainer);
        }
    }

    displayPosts(posts, vipContainer, regularContainer) {
        const vipPosts = posts.filter(p => p.is_vip === true);
        const regularPosts = posts.filter(p => p.is_vip !== true);
        
        if (vipContainer) {
            vipContainer.innerHTML = '';
            if (vipPosts.length > 0) {
                vipPosts.slice(0, 6).forEach(p => vipContainer.appendChild(this.createPostCard(p)));
            } else {
                vipContainer.innerHTML = '<div class="no-listings">No VIP listings available</div>';
            }
        }
        
        if (regularContainer) {
            regularContainer.innerHTML = '';
            if (regularPosts.length > 0) {
                regularPosts.slice(0, 12).forEach(p => regularContainer.appendChild(this.createPostCard(p)));
            } else {
                regularContainer.innerHTML = '<div class="no-listings">No listings available</div>';
            }
        }
    }

    displayLocalPosts(vipContainer, regularContainer) {
        const vipPosts = this.posts.filter(p => p.subscriptionType === 'vip' && p.status === 'active');
        const regularPosts = this.posts.filter(p => p.subscriptionType === 'regular' && p.status === 'active');
        
        if (vipContainer) {
            vipContainer.innerHTML = '';
            if (vipPosts.length > 0) {
                vipPosts.slice(0, 6).forEach(p => vipContainer.appendChild(this.createPostCard(p)));
            } else {
                vipContainer.innerHTML = '<div class="no-listings">No VIP listings available</div>';
            }
        }
        
        if (regularContainer) {
            regularContainer.innerHTML = '';
            if (regularPosts.length > 0) {
                regularPosts.slice(0, 12).forEach(p => regularContainer.appendChild(this.createPostCard(p)));
            } else {
                regularContainer.innerHTML = '<div class="no-listings">No listings available</div>';
            }
        }
    }

    createPostCard(post) {
        const card = document.createElement('div');
        card.className = `listing-card ${post.is_vip ? 'vip-card' : ''}`;
        card.innerHTML = `
            ${post.is_vip ? '<div class="vip-badge"><i class="fas fa-crown"></i> VIP</div>' : ''}
            <img src="${post.images?.[0] || 'images/default-avatar.jpg'}" class="listing-image" onerror="this.src='images/default-avatar.jpg'">
            <div class="listing-content">
                <h3>${this.escapeHtml(post.title || 'Untitled')}</h3>
                <p class="listing-description">${this.escapeHtml((post.description || '').substring(0, 100))}...</p>
                <div class="listing-meta">
                    <span><i class="fas fa-user"></i> ${post.username || 'User'}</span>
                    <span><i class="fas fa-clock"></i> ${this.formatDate(post.created_at || post.createdAt)}</span>
                </div>
            </div>
        `;
        return card;
    }

    formatDate(dateString) {
        if (!dateString) return 'Recently';
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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
