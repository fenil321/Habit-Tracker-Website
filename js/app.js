/**
 * Main App Module - Application entry point and lifecycle management
 * Initializes all modules and handles app-wide functionality
 */

class HabitTrackerApp {
    constructor() {
        this.isInitialized = false;
        this.autoSaveInterval = null;
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        try {
            // Initialize all modules
            this.initializeModules();
            
            // Set up auto-save
            this.setupAutoSave();
            
            // Set up periodic updates
            this.setupPeriodicUpdates();
            
            // Initialize UI
            uiManager.init();
            
            // Load any saved reminders
            notificationManager.loadReminders();
            
            // Update notification button status
            this.updateNotificationButtonStatus();
            
            this.isInitialized = true;
            console.log('Habit Tracker initialized successfully');
            
            // Show welcome message for new users
            this.showWelcomeMessage();
            
        } catch (error) {
            console.error('Error initializing Habit Tracker:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    /**
     * Initialize all application modules
     */
    initializeModules() {
        // Verify all required modules are available
        if (!storage || !habitManager || !chartManager || !notificationManager || !uiManager) {
            throw new Error('Required modules not loaded');
        }

        // Initialize storage
        storage.initializeStorage();
        
        // Load habits
        habitManager.loadHabits();
        
        // Initialize charts
        chartManager.initCharts();
        
        // Initialize notifications
        notificationManager.init();
    }

    /**
     * Set up auto-save functionality
     */
    setupAutoSave() {
        // Auto-save every 30 seconds
        this.autoSaveInterval = setInterval(() => {
            this.autoSave();
        }, 30000);
    }

    /**
     * Set up periodic updates
     */
    setupPeriodicUpdates() {
        // Update UI every minute
        setInterval(() => {
            if (this.isInitialized) {
                uiManager.updateStatsDisplay();
            }
        }, 60000);

        // Check for streak milestones every hour
        setInterval(() => {
            if (this.isInitialized) {
                this.checkStreakMilestones();
            }
        }, 3600000);
    }

    /**
     * Auto-save current state
     */
    autoSave() {
        try {
            // Trigger a save by updating settings
            const settings = storage.getSettings();
            storage.saveSettings(settings);
            
            // Update charts if needed
            chartManager.updateAllCharts();
            
        } catch (error) {
            console.error('Auto-save error:', error);
        }
    }

    /**
     * Check for streak milestones and send notifications
     */
    checkStreakMilestones() {
        const habits = habitManager.getHabits();
        
        habits.forEach(habit => {
            const stats = habitManager.getHabitStats(habit.id);
            if (stats.currentStreak > 0) {
                // Check for milestone streaks (7, 30, 100 days)
                const milestones = [7, 30, 100];
                milestones.forEach(milestone => {
                    if (stats.currentStreak === milestone) {
                        notificationManager.sendStreakNotification(habit.id, milestone);
                    }
                });
            }
        });
    }

    /**
     * Update notification button status
     */
    updateNotificationButtonStatus() {
        const notificationBtn = document.getElementById('notificationBtn');
        if (!notificationBtn) return;

        const status = notificationManager.getStatus();
        
        if (status.enabled && status.permission === 'granted') {
            notificationBtn.innerHTML = '<i class="fas fa-bell"></i> Notifications Enabled';
            notificationBtn.classList.add('btn-success');
            notificationBtn.classList.remove('btn-secondary');
        } else if (status.permission === 'denied') {
            notificationBtn.innerHTML = '<i class="fas fa-bell-slash"></i> Notifications Blocked';
            notificationBtn.classList.add('btn-danger');
            notificationBtn.classList.remove('btn-secondary');
        } else {
            notificationBtn.innerHTML = '<i class="fas fa-bell"></i> Enable Notifications';
            notificationBtn.classList.remove('btn-success', 'btn-danger');
            notificationBtn.classList.add('btn-secondary');
        }
    }

    /**
     * Show welcome message for new users
     */
    showWelcomeMessage() {
        const habits = habitManager.getHabits();
        if (habits.length === 0) {
            // New user - show welcome message
            setTimeout(() => {
                uiManager.showToast('Welcome to Habit Tracker! Add your first habit to get started.', 'info');
            }, 1000);
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        console.error(message);
        uiManager.showToast(message, 'error');
    }

    /**
     * Export all data
     */
    exportData() {
        try {
            const data = storage.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `habit-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            uiManager.showToast('Data exported successfully!', 'success');
        } catch (error) {
            console.error('Export error:', error);
            uiManager.showToast('Failed to export data', 'error');
        }
    }

    /**
     * Import data from file
     */
    importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    const success = storage.importData(data);
                    
                    if (success) {
                        // Reload all data
                        habitManager.loadHabits();
                        uiManager.refreshUI();
                        notificationManager.loadReminders();
                        
                        uiManager.showToast('Data imported successfully!', 'success');
                        resolve(true);
                    } else {
                        throw new Error('Invalid data format');
                    }
                } catch (error) {
                    console.error('Import error:', error);
                    uiManager.showToast('Failed to import data. Please check the file format.', 'error');
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                uiManager.showToast('Failed to read file', 'error');
                reject(new Error('File read error'));
            };
            
            reader.readAsText(file);
        });
    }

    /**
     * Clear all data
     */
    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            try {
                storage.clearAllData();
                habitManager.loadHabits();
                notificationManager.clearAllReminders();
                uiManager.refreshUI();
                
                uiManager.showToast('All data cleared successfully', 'success');
            } catch (error) {
                console.error('Clear data error:', error);
                uiManager.showToast('Failed to clear data', 'error');
            }
        }
    }

    /**
     * Get app statistics
     */
    getAppStats() {
        const storageStats = storage.getStorageStats();
        const overallStats = habitManager.getOverallStats();
        const notificationStatus = notificationManager.getStatus();
        
        return {
            storage: storageStats,
            habits: overallStats,
            notifications: notificationStatus,
            appVersion: '1.0.0',
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Handle app visibility change
     */
    handleVisibilityChange() {
        if (!document.hidden && this.isInitialized) {
            // App became visible - refresh data
            uiManager.refreshUI();
            this.updateNotificationButtonStatus();
        }
    }

    /**
     * Handle beforeunload event
     */
    handleBeforeUnload() {
        // Save any pending data
        this.autoSave();
        
        // Clear any scheduled reminders
        notificationManager.clearAllReminders();
    }

    /**
     * Set up global event listeners
     */
    setupGlobalEvents() {
        // Handle visibility change
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        // Handle before unload
        window.addEventListener('beforeunload', () => {
            this.handleBeforeUnload();
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            uiManager.showToast('Connection restored', 'success');
        });

        window.addEventListener('offline', () => {
            uiManager.showToast('You are offline. Data will be saved locally.', 'warning');
        });
    }

    /**
     * Initialize global events
     */
    initGlobalEvents() {
        this.setupGlobalEvents();
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        notificationManager.clearAllReminders();
        
        // Destroy charts
        chartManager.destroyAllCharts();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create global app instance
    window.habitTrackerApp = new HabitTrackerApp();
    
    // Set up global events
    window.habitTrackerApp.initGlobalEvents();
    
    // Expose useful functions globally for debugging
    window.debugApp = {
        exportData: () => window.habitTrackerApp.exportData(),
        importData: (file) => window.habitTrackerApp.importData(file),
        clearData: () => window.habitTrackerApp.clearAllData(),
        getStats: () => window.habitTrackerApp.getAppStats(),
        testNotification: () => notificationManager.testNotification()
    };
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.habitTrackerApp) {
        window.habitTrackerApp.cleanup();
    }
});

// Handle service worker registration for PWA capabilities
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
} 