async loadListings() {
    console.log('Loading listings...');
    const vipListings = document.getElementById('vip-listings');
    const regularListings = document.getElementById('regular-listings');
    
    if (!vipListings && !regularListings) return;
    
    // Clear loading messages
    if (vipListings) vipListings.innerHTML = '';
    if (regularListings) regularListings.innerHTML = '';
    
    try {
        // IMPORTANT: Check if supabase is available on window
        if (!window.supabase || !window.supabase.from) {
            console.warn('Supabase not ready yet, using local fallback');
            this.displayLocalPosts(vipListings, regularListings);
            return;
        }
        
        // Try to fetch from Supabase if available
        const { data: posts, error } = await window.supabase
            .from('posts')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false });
        
        if (!error && posts) {
            this.displayPosts(posts, vipListings, regularListings);
            return;
        }
        
        // Fallback to local storage if Supabase fails
        this.displayLocalPosts(vipListings, regularListings);
        
    } catch (error) {
        console.error('Error loading listings:', error);
        this.displayLocalPosts(vipListings, regularListings);
    }
}
