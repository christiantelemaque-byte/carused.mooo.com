// Main Application JavaScript

class EscortDirectory {
    constructor() {
        this.auth = new AuthSystem();
        this.posts = JSON.parse(localStorage.getItem('luxePosts')) || [];
        this.init();
    }

    init() {
        this.loadListings();
        this.setupEventListeners();
        this.checkUserSubscription();
    }

    loadListings() {
        const vipListings = document.getElementById('vip-listings');
        const regularListings = document.getElementById('regular-listings');
        
        if (!vipListings && !regularListings) return;
        
        // Clear loading messages
        if (vipListings) vipListings.innerHTML = '';
        if (regularListings) regularListings.innerHTML = '';
        
        // Get VIP posts
        const vipPosts = this.posts.filter(post => post.subscriptionType === 'vip' && post.status === 'active');
        const regularPosts = this.posts.filter(post => post.subscriptionType === 'regular' && post.status === 'active');
        
        // Sort by date (newest first)
        vipPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        regularPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Display VIP posts
        if (vipListings) {
            vipPosts.slice(0, 6).forEach(post => {
                vipListings.appendChild(this.createPostCard(post));
            });
            
            if (vipPosts.length === 0) {
                vipListings.innerHTML = '<div class="no-listings">No VIP listings available</div>';
            }
        }
        
        // Display regular posts
        if (regularListings) {
            regularPosts.slice(0, 12).forEach(post => {
                regularListings.appendChild(this.createPostCard(post));
            });
            
            if (regularPosts.length === 0) {
                regularListings.innerHTML = '<div class="no-listings">No listings available</div>';
            }
        }
    }

    createPostCard(post) {
        const card = document.createElement('div');
        card.className = `listing-card ${post.subscriptionType === 'vip' ? 'vip-card' : ''}`;
        
        const user = this.auth.users.find(u => u.id === post.userId);
        const username = user ? user.username : 'Anonymous';
        
        card.innerHTML = `
            ${post.subscriptionType === 'vip' ? '<div class="vip-badge"><i class="fas fa-crown"></i> VIP</div>' : ''}
            <img src="${post.images[0] || 'images/default-avatar.jpg'}" alt="${post.title}" class="listing-image">
            <div class="listing-content">
                <h3>${this.escapeHtml(post.title)}</h3>
                <p class="listing-description">${this.escapeHtml(post.description.substring(0, 100))}...</p>
                <div class="listing-meta">
                    <span><i class="fas fa-user"></i> ${this.escapeHtml(username)}</span>
                    <span><i class="fas fa-clock"></i> ${this.formatDate(post.createdAt)}</span>
                </div>
                <div class="listing-tags">
                    ${post.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                </div>
            </div>
        `;
        
        return card;
    }

    createPost(postData) {
        if (!this.auth.currentUser) {
            this.showMessage('Please login to create a post', 'error');
            return false;
        }
        
        if (!this.auth.hasActiveSubscription()) {
            this.showMessage('Active subscription required to create posts', 'error');
            window.location.href = 'subscription.html';
            return false;
        }
        
        const newPost = {
            id: Date.now(),
            userId: this.auth.currentUser.id,
            title: postData.title,
            description: postData.description,
            images: postData.images,
            tags: postData.tags,
            subscriptionType: this.auth.getSubscriptionType(),
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.posts.push(newPost);
        this.savePosts();
        
        // Add post to user's posts
        const userIndex = this.auth.users.findIndex(u => u.id === this.auth.currentUser.id);
        if (userIndex !== -1) {
            this.auth.users[userIndex].posts.push(newPost.id);
            this.auth.saveUsers();
        }
        
        this.showMessage('Post created successfully!', 'success');
        return true;
    }

    getUserPosts() {
        if (!this.auth.currentUser) return [];
        
        return this.posts.filter(post => 
            post.userId === this.auth.currentUser.id && 
            post.status === 'active'
        );
    }

    deletePost(postId) {
        const postIndex = this.posts.findIndex(p => p.id === postId);
        if (postIndex === -1) return false;
        
        // Mark as deleted instead of removing
        this.posts[postIndex].status = 'deleted';
        this.posts[postIndex].updatedAt = new Date().toISOString();
        
        this.savePosts();
        return true;
    }

    savePosts() {
        localStorage.setItem('luxePosts', JSON.stringify(this.posts));
    }

    checkUserSubscription() {
        if (!this.auth.currentUser) return;
        
        const expiry = new Date(this.auth.currentUser.subscriptionExpiry);
        if (new Date() > expiry && this.auth.currentUser.subscription !== 'none') {
            // Subscription expired
            const userIndex = this.auth.users.findIndex(u => u.id === this.auth.currentUser.id);
            if (userIndex !== -1) {
                this.auth.users[userIndex].subscription = 'none';
                this.auth.users[userIndex].subscriptionExpiry = null;
                this.auth.saveUsers();
                this.auth.currentUser = this.auth.users[userIndex];
                localStorage.setItem('currentUser', JSON.stringify(this.auth.currentUser));
                
                this.showMessage('Your subscription has expired. Please renew to continue posting.', 'warning');
            }
        }
    }

    setupEventListeners() {
        // Post ad button
        document.querySelectorAll('.btn-primary, .btn-hero-primary').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (e.target.href && e.target.href.includes('#post-ad')) {
                    e.preventDefault();
                    if (this.auth.currentUser) {
                        if (this.auth.hasActiveSubscription()) {
                            window.location.href = 'post-ad.html';
                        } else {
                            window.location.href = 'subscription.html';
                        }
                    } else {
                        const modal = document.getElementById('authModal');
                        if (modal) {
                            modal.style.display = 'block';
                            loadAuthForms();
                        }
                    }
                }
            });
        });
    }

    showMessage(message, type) {
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;
        
        // Add styles
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'error' ? '#ff3860' : type === 'success' ? '#23d160' : '#ffdd57'};
            color: ${type === 'warning' ? '#333' : 'white'};
            border-radius: 5px;
            z-index: 10000;
            display: flex;
            justify-content: space-between;
            align-items: center;
            min-width: 300px;
            max-width: 500px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(messageDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentElement) {
                messageDiv.remove();
            }
        }, 5000);
    }

    formatDate(dateString) {
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

// Initialize the application
const app = new EscortDirectory();

// Utility function for currency formatting
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Load posts on page load
document.addEventListener('DOMContentLoaded', () => {
    app.loadListings();
});
