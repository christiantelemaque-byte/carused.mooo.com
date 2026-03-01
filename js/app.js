// js/app.js – with clickable post cards
console.log('✅ app.js loaded');

class EscortDirectory {
    constructor() {
        this.fallbackPosts = JSON.parse(localStorage.getItem('luxePosts')) || [];
        document.addEventListener('DOMContentLoaded', () => this.init());
    }

    init() {
        this.loadListings();
        this.setupEventListeners();
    }

    async loadListings() {
        const vipContainer = document.getElementById('vip-listings');
        const regularContainer = document.getElementById('regular-listings');
        if (!vipContainer && !regularContainer) return;

        if (vipContainer) vipContainer.innerHTML = '';
        if (regularContainer) regularContainer.innerHTML = '';

        // Try to load from cache first
        const cachedPosts = getPublicPosts();
        if (cachedPosts && cachedPosts.length > 0) {
            this.displayPosts(cachedPosts, vipContainer, regularContainer);
            this.refreshListings(vipContainer, regularContainer);
        } else {
            await this.refreshListings(vipContainer, regularContainer);
        }
    }

    async refreshListings(vipContainer, regularContainer) {
        try {
            if (!window.supabase || typeof window.supabase.from !== 'function') {
                console.warn('Supabase not available, using fallback');
                this.displayFallback(vipContainer, regularContainer);
                return;
            }

            const { data: posts, error } = await window.supabase
                .from('posts')
                .select('*, profiles(username)')
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Supabase error:', error);
                this.displayFallback(vipContainer, regularContainer);
                return;
            }

            if (!posts || posts.length === 0) {
                this.displayNoPosts(vipContainer, regularContainer);
                return;
            }

            setPublicPosts(posts);
            this.displayPosts(posts, vipContainer, regularContainer);
        } catch (err) {
            console.error('Unexpected error in refreshListings:', err);
            this.displayFallback(vipContainer, regularContainer);
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

    displayFallback(vipContainer, regularContainer) {
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

    displayNoPosts(vipContainer, regularContainer) {
        if (vipContainer) vipContainer.innerHTML = '<div class="no-listings">No VIP listings yet</div>';
        if (regularContainer) regularContainer.innerHTML = '<div class="no-listings">No regular listings yet</div>';
    }

    createPostCard(post) {
        const card = document.createElement('div');
        card.className = `listing-card ${post.is_vip ? 'vip-card' : ''}`;
        
        // Make the entire card clickable – redirect to post detail page
        card.addEventListener('click', () => {
            window.location.href = `post.html?id=${post.id}`;
        });
        card.style.cursor = 'pointer'; // indicate it's clickable

        const title = post.title || (post.is_vip ? 'VIP Companion' : 'Companion');
        const desc = post.description || 'No description provided.';
        const imageUrl = (post.images && post.images[0]) ? post.images[0] : 'images/default-avatar.jpg';
        const date = post.created_at ? new Date(post.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : 'Recently';
        // Use username from joined profiles if available, else fallback
        const username = post.profiles?.username || post.username || (post.user_id ? 'User' : 'Anonymous');

        card.innerHTML = `
            ${post.is_vip ? '<div class="vip-badge"><i class="fas fa-crown"></i> VIP</div>' : ''}
            <img src="${imageUrl}" class="listing-image" onerror="this.src='images/default-avatar.jpg'">
            <div class="listing-content">
                <h3>${this.escapeHtml(title.substring(0, 50))}</h3>
                <p class="listing-description">${this.escapeHtml(desc.substring(0, 100))}...</p>
                <div class="listing-meta">
                    <span><i class="fas fa-user"></i> ${this.escapeHtml(username)}</span>
                    <span><i class="fas fa-clock"></i> ${date}</span>
                </div>
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

// Start the app
const app = new EscortDirectory();
