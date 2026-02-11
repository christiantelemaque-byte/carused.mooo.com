// js/app.js - Updated for current auth system
console.log('✅ app.js loaded');

class EscortDirectory {
    constructor() {
        // Don't create AuthSystem here - use the supabase client from auth.js
        this.posts = JSON.parse(localStorage.getItem('luxePosts')) || [];
        
        // Wait for page to load, then initialize
        document.addEventListener('DOMContentLoaded', () => {
            this.init();
        });
    }

    init() {
        console.log('Initializing EscortDirectory...');
        this.loadListings();
        this.setupEventListeners();
    }

    async loadListings() {
        console.log('Loading listings...');
        const vipListings = document.getElementById('vip-listings');
        const regularListings = document.getElementById('regular-listings');
        
        if (!vipListings && !regularListings) return;
        
        // Clear loading messages
        if (vipListings) vipListings.innerHTML = '';
        if (regularListings) regularListings.innerHTML = '';
        
        try {
            // Try to fetch from Supabase if available
            if (typeof supabase !== 'undefined') {
                const { data: posts, error } = await supabase
                    .from('posts')
                    .select('*')
                    .eq('status', 'active')
                    .order('created_at', { ascending: false });
                
                if (!error && posts) {
                    this.displayPosts(posts, vipListings, regularListings);
                    return;
                }
            }
            
            // Fallback to local storage if Supabase fails or isn't available
            this.displayLocalPosts(vipListings, regularListings);
            
        } catch (error) {
            console.error('Error loading listings:', error);
            this.displayLocalPosts(vipListings, regularListings);
        }
    }

    displayPosts(posts, vipContainer, regularContainer) {
        // Separate VIP and regular posts
        const vipPosts = posts.filter(post => post.is_vip === true);
        const regularPosts = posts.filter(post => post.is_vip !== true);
        
        // Display VIP posts (limit to 6)
        if (vipContainer) {
            if (vipPosts.length > 0) {
                vipPosts.slice(0, 6).forEach(post => {
                    vipContainer.appendChild(this.createPostCard(post));
                });
            } else {
                vipContainer.innerHTML = '<div class="no-listings">No VIP listings available</div>';
            }
        }
        
        // Display regular posts (limit to 12)
        if (regularContainer) {
            if (regularPosts.length > 0) {
                regularPosts.slice(0, 12).forEach(post => {
                    regularContainer.appendChild(this.createPostCard(post));
                });
            } else {
                regularContainer.innerHTML = '<div class="no-listings">No listings available</div>';
            }
        }
    }

    displayLocalPosts(vipContainer, regularContainer) {
        // Use local storage posts as fallback
        const vipPosts = this.posts.filter(post => 
            post.subscriptionType === 'vip' && post.status === 'active'
        );
        const regularPosts = this.posts.filter(post => 
            post.subscriptionType === 'regular' && post.status === 'active'
        );
        
        vipPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        regularPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        if (vipContainer) {
            if (vipPosts.length > 0) {
                vipPosts.slice(0, 6).forEach(post => {
                    vipContainer.appendChild(this.createPostCard(post));
                });
            } else {
                vipContainer.innerHTML = '<div class="no-listings">No VIP listings available</div>';
            }
        }
        
        if (regularContainer) {
            if (regularPosts.length > 0) {
                regularPosts.slice(0, 12).forEach(post => {
                    regularContainer.appendChild(this.createPostCard(post));
                });
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
            <img src="${post.images && post.images[0] ? post.images[0] : 'images/default-avatar.jpg'}" 
                 alt="${post.title || 'Listing'}" 
                 class="listing-image"
                 onerror="this.src='images/default-avatar.jpg'">
            <div class="listing-content">
                <h3>${this.escapeHtml(post.title || 'Untitled Listing')}</h3>
                <p class="listing-description">${this.escapeHtml((post.description || '').substring(0, 100))}...</p>
                <div class="listing-meta">
                    <span><i class="fas fa-user"></i> ${post.username || 'User'}</span>
                    <span><i class="fas fa-clock"></i> ${this.formatDate(post.created_at || post.createdAt)}</span>
                </div>
            </div>
        `;
        
        return card;
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        // Any additional event listeners can go here
    }

    formatDate(dateString) {
        if (!dateString) return 'Recently';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app
const app = new EscortDirectory();
