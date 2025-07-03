// SkinCareBuddy JavaScript
class SkinCareBuddy {
    constructor() {
        this.routines = JSON.parse(localStorage.getItem('skincareRoutines')) || [];
        this.products = JSON.parse(localStorage.getItem('skincareProducts')) || [];
        this.photos = JSON.parse(localStorage.getItem('skincarePhotos')) || [];
        this.streak = parseInt(localStorage.getItem('skincareStreak')) || 0;
        this.lastCompletedDate = localStorage.getItem('lastCompletedDate') || null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderRoutines();
        this.renderProducts();
        this.renderPhotos();
        this.updateStreak();
        this.checkDailyReset();
    }

    setupEventListeners() {
        // Modal controls
        document.getElementById('addStepBtn').addEventListener('click', () => this.openModal('stepModal'));
        document.getElementById('addProductBtn').addEventListener('click', () => this.openModal('productModal'));
        
        // Close modals
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => this.closeModal(e.target.closest('.modal')));
        });

        // Close modal when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal(modal);
            });
        });

        // Form submissions
        document.getElementById('stepForm').addEventListener('submit', (e) => this.handleStepSubmit(e));
        document.getElementById('productForm').addEventListener('submit', (e) => this.handleProductSubmit(e));

        // Photo upload
        document.getElementById('uploadArea').addEventListener('click', () => document.getElementById('photoInput').click());
        document.getElementById('photoInput').addEventListener('change', (e) => this.handlePhotoUpload(e));
    }

    openModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeModal(modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        modal.querySelector('form').reset();
    }

    handleStepSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const step = {
            id: Date.now(),
            name: formData.get('stepName') || document.getElementById('stepName').value,
            time: formData.get('stepTime') || document.getElementById('stepTime').value,
            product: formData.get('stepProduct') || document.getElementById('stepProduct').value,
            completed: false,
            date: new Date().toISOString().split('T')[0]
        };

        this.routines.push(step);
        this.saveRoutines();
        this.renderRoutines();
        this.closeModal(document.getElementById('stepModal'));
        this.showNotification('Routine step added! ✨');
    }

    handleProductSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const product = {
            id: Date.now(),
            name: formData.get('productName') || document.getElementById('productName').value,
            type: formData.get('productType') || document.getElementById('productType').value,
            expiry: formData.get('productExpiry') || document.getElementById('productExpiry').value,
            dateAdded: new Date().toISOString().split('T')[0]
        };

        this.products.push(product);
        this.saveProducts();
        this.renderProducts();
        this.closeModal(document.getElementById('productModal'));
        this.showNotification('Product added! 🧴');
    }

    handlePhotoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            this.showNotification('Please select an image file! 📸', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const photo = {
                id: Date.now(),
                src: event.target.result,
                date: new Date().toISOString().split('T')[0],
                timestamp: new Date().toISOString()
            };

            this.photos.push(photo);
            this.savePhotos();
            this.renderPhotos();
            this.showNotification('Photo uploaded! 📸');
        };

        reader.readAsDataURL(file);
        e.target.value = ''; // Reset input
    }

    toggleRoutineComplete(routineId) {
        const routine = this.routines.find(r => r.id === routineId);
        if (routine) {
            routine.completed = !routine.completed;
            this.saveRoutines();
            this.renderRoutines();
            this.updateStreak();
            
            if (routine.completed) {
                this.showNotification('Step completed! 🌟');
            }
        }
    }

    deleteRoutine(routineId) {
        this.routines = this.routines.filter(r => r.id !== routineId);
        this.saveRoutines();
        this.renderRoutines();
        this.showNotification('Step removed! 🗑️');
    }

    deleteProduct(productId) {
        this.products = this.products.filter(p => p.id !== productId);
        this.saveProducts();
        this.renderProducts();
        this.showNotification('Product removed! 🗑️');
    }

    deletePhoto(photoId) {
        this.photos = this.photos.filter(p => p.id !== photoId);
        this.savePhotos();
        this.renderPhotos();
        this.showNotification('Photo removed! 🗑️');
    }

    renderRoutines() {
        const grid = document.getElementById('routineGrid');
        const today = new Date().toISOString().split('T')[0];
        
        // Filter routines for today
        const todayRoutines = this.routines.filter(routine => routine.date === today);
        
        if (todayRoutines.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-plus-circle" style="font-size: 3rem; color: #cbd5e0; margin-bottom: 15px;"></i>
                    <p style="color: #718096; text-align: center;">No routine steps for today. Add your first step to get started! ✨</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = todayRoutines.map(routine => `
            <div class="routine-item ${routine.completed ? 'completed' : ''}">
                <div class="routine-info">
                    <div class="routine-name">${routine.name}</div>
                    <div class="routine-details">
                        <span class="routine-time">${this.getTimeLabel(routine.time)}</span>
                        ${routine.product ? `<span class="routine-product">${routine.product}</span>` : ''}
                    </div>
                </div>
                <div class="routine-actions">
                    <button class="check-btn ${routine.completed ? 'completed' : ''}" 
                            onclick="app.toggleRoutineComplete(${routine.id})">
                        <i class="fas ${routine.completed ? 'fa-check' : 'fa-check'}"></i>
                    </button>
                    <button class="delete-btn" onclick="app.deleteRoutine(${routine.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderProducts() {
        const grid = document.getElementById('productsGrid');
        
        if (this.products.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-pump-soap" style="font-size: 3rem; color: #cbd5e0; margin-bottom: 15px;"></i>
                    <p style="color: #718096; text-align: center;">No products added yet. Add your first product! 🧴</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.products.map(product => {
            const isExpiringSoon = this.isExpiringSoon(product.expiry);
            return `
                <div class="product-card">
                    <div class="product-name">${product.name}</div>
                    <div class="product-type">${this.getProductTypeLabel(product.type)}</div>
                    ${product.expiry ? `
                        <div class="product-expiry ${isExpiringSoon ? 'expiring-soon' : ''}">
                            <i class="fas fa-calendar-alt"></i>
                            Expires: ${this.formatDate(product.expiry)}
                            ${isExpiringSoon ? ' ⚠️' : ''}
                        </div>
                    ` : ''}
                    <button class="delete-btn" style="margin-top: 10px;" onclick="app.deleteProduct(${product.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        }).join('');
    }

    renderPhotos() {
        const gallery = document.getElementById('photoGallery');
        
        if (this.photos.length === 0) {
            gallery.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-camera" style="font-size: 3rem; color: #cbd5e0; margin-bottom: 15px;"></i>
                    <p style="color: #718096; text-align: center;">No progress photos yet. Upload your first photo! 📸</p>
                </div>
            `;
            return;
        }

        // Sort photos by date (newest first)
        const sortedPhotos = [...this.photos].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        gallery.innerHTML = sortedPhotos.map(photo => `
            <div class="photo-item">
                <img src="${photo.src}" alt="Progress photo from ${photo.date}">
                <div class="photo-date">
                    ${this.formatDate(photo.date)}
                    <button class="delete-btn" style="margin-left: 10px;" onclick="app.deletePhoto(${photo.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateStreak() {
        const today = new Date().toISOString().split('T')[0];
        const todayRoutines = this.routines.filter(routine => routine.date === today);
        const completedToday = todayRoutines.length > 0 && todayRoutines.every(routine => routine.completed);

        if (completedToday && this.lastCompletedDate !== today) {
            if (this.lastCompletedDate === this.getYesterday()) {
                this.streak++;
            } else if (this.lastCompletedDate !== today) {
                this.streak = 1;
            }
            this.lastCompletedDate = today;
            this.saveStreak();
        }

        document.getElementById('streak').textContent = this.streak;
    }

    checkDailyReset() {
        const today = new Date().toISOString().split('T')[0];
        if (this.lastCompletedDate && this.lastCompletedDate !== today) {
            // Reset completed status for new day
            this.routines.forEach(routine => {
                if (routine.date !== today) {
                    routine.completed = false;
                }
            });
            this.saveRoutines();
            this.renderRoutines();
        }
    }

    // Utility functions
    getTimeLabel(time) {
        const labels = {
            morning: '🌅 Morning',
            evening: '🌙 Evening',
            both: '🌅🌙 Both'
        };
        return labels[time] || time;
    }

    getProductTypeLabel(type) {
        const labels = {
            cleanser: '🧼 Cleanser',
            toner: '💧 Toner',
            serum: '✨ Serum',
            moisturizer: '💧 Moisturizer',
            sunscreen: '☀️ Sunscreen',
            mask: '🎭 Mask',
            other: '🧴 Other'
        };
        return labels[type] || type;
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    isExpiringSoon(expiryDate) {
        if (!expiryDate) return false;
        const expiry = new Date(expiryDate);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
    }

    getYesterday() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
    }

    showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#f56565' : '#48bb78'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            font-weight: 500;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Local storage functions
    saveRoutines() {
        localStorage.setItem('skincareRoutines', JSON.stringify(this.routines));
    }

    saveProducts() {
        localStorage.setItem('skincareProducts', JSON.stringify(this.products));
    }

    savePhotos() {
        localStorage.setItem('skincarePhotos', JSON.stringify(this.photos));
    }

    saveStreak() {
        localStorage.setItem('skincareStreak', this.streak.toString());
        localStorage.setItem('lastCompletedDate', this.lastCompletedDate);
    }
}

// Initialize the app
const app = new SkinCareBuddy();

// Add some sample data for first-time users
if (app.routines.length === 0 && app.products.length === 0) {
    // Add sample routine steps
    const sampleRoutines = [
        {
            id: Date.now() - 3,
            name: 'Gentle Cleanser',
            time: 'both',
            product: 'CeraVe Hydrating Cleanser',
            completed: false,
            date: new Date().toISOString().split('T')[0]
        },
        {
            id: Date.now() - 2,
            name: 'Vitamin C Serum',
            time: 'morning',
            product: 'The Ordinary Vitamin C',
            completed: false,
            date: new Date().toISOString().split('T')[0]
        },
        {
            id: Date.now() - 1,
            name: 'Moisturizer',
            time: 'both',
            product: 'Neutrogena Hydro Boost',
            completed: false,
            date: new Date().toISOString().split('T')[0]
        }
    ];

    // Add sample products
    const sampleProducts = [
        {
            id: Date.now() - 6,
            name: 'CeraVe Hydrating Cleanser',
            type: 'cleanser',
            expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            dateAdded: new Date().toISOString().split('T')[0]
        },
        {
            id: Date.now() - 5,
            name: 'The Ordinary Vitamin C',
            type: 'serum',
            expiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            dateAdded: new Date().toISOString().split('T')[0]
        },
        {
            id: Date.now() - 4,
            name: 'Neutrogena Hydro Boost',
            type: 'moisturizer',
            expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            dateAdded: new Date().toISOString().split('T')[0]
        }
    ];

    app.routines = sampleRoutines;
    app.products = sampleProducts;
    app.saveRoutines();
    app.saveProducts();
    app.renderRoutines();
    app.renderProducts();
    
    app.showNotification('Welcome to SkinCareBuddy! Sample routine added! ✨');
} 