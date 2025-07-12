/**
 * Notifications Module - Handles Web Notifications API
 * Manages permission requests, scheduled reminders, and notification display
 */

class NotificationManager {
    constructor() {
        this.permission = 'default';
        this.reminderIntervals = {};
        this.checkPermission();
        this.loadSettings();
    }

    /**
     * Check current notification permission status
     */
    checkPermission() {
        if ('Notification' in window) {
            this.permission = Notification.permission;
        }
    }

    /**
     * Request notification permission from user
     */
    async requestPermission() {
        if (!('Notification' in window)) {
            console.warn('Notifications not supported in this browser');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            
            if (permission === 'granted') {
                this.updateSettings({ notificationsEnabled: true });
                this.showToast('Notifications enabled!', 'success');
                return true;
            } else {
                this.updateSettings({ notificationsEnabled: false });
                this.showToast('Notifications blocked. Please enable in browser settings.', 'warning');
                return false;
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }

    /**
     * Send immediate notification
     */
    sendNotification(title, options = {}) {
        if (!('Notification' in window) || this.permission !== 'granted') {
            return false;
        }

        const defaultOptions = {
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            requireInteraction: false,
            silent: false,
            tag: 'habit-reminder'
        };

        try {
            const notification = new Notification(title, { ...defaultOptions, ...options });
            
            // Auto-close after 5 seconds
            setTimeout(() => {
                notification.close();
            }, 5000);

            // Handle notification click
            notification.onclick = function() {
                window.focus();
                notification.close();
            };

            return true;
        } catch (error) {
            console.error('Error sending notification:', error);
            return false;
        }
    }

    /**
     * Schedule a reminder for a specific habit
     */
    scheduleReminder(habitId, time, message) {
        if (!this.permission === 'granted') {
            return false;
        }

        const habit = habitManager.getHabit(habitId);
        if (!habit) return false;

        // Clear existing reminder for this habit
        this.clearReminder(habitId);

        // Parse time (format: "HH:MM")
        const [hours, minutes] = time.split(':').map(Number);
        
        // Calculate next reminder time
        const now = new Date();
        const reminderTime = new Date();
        reminderTime.setHours(hours, minutes, 0, 0);

        // If time has passed today, schedule for tomorrow
        if (reminderTime <= now) {
            reminderTime.setDate(reminderTime.getDate() + 1);
        }

        // Calculate delay until reminder
        const delay = reminderTime.getTime() - now.getTime();

        // Schedule the reminder
        const timeoutId = setTimeout(() => {
            this.sendHabitReminder(habitId, message);
            // Schedule next reminder for tomorrow
            this.scheduleReminder(habitId, time, message);
        }, delay);

        // Store the timeout ID
        this.reminderIntervals[habitId] = timeoutId;

        // Update settings
        const settings = storage.getSettings();
        settings.reminderTimes[habitId] = { time, message };
        storage.saveSettings(settings);

        return true;
    }

    /**
     * Clear reminder for a specific habit
     */
    clearReminder(habitId) {
        if (this.reminderIntervals[habitId]) {
            clearTimeout(this.reminderIntervals[habitId]);
            delete this.reminderIntervals[habitId];
        }

        // Remove from settings
        const settings = storage.getSettings();
        delete settings.reminderTimes[habitId];
        storage.saveSettings(settings);
    }

    /**
     * Send habit-specific reminder notification
     */
    sendHabitReminder(habitId, message) {
        const habit = habitManager.getHabit(habitId);
        if (!habit) return;

        const title = `Habit Reminder: ${habit.name}`;
        const options = {
            body: message || 'Time to complete your habit!',
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            requireInteraction: true,
            actions: [
                {
                    action: 'complete',
                    title: 'Mark Complete',
                    icon: '/favicon.ico'
                },
                {
                    action: 'snooze',
                    title: 'Snooze 5 min',
                    icon: '/favicon.ico'
                }
            ],
            data: {
                habitId: habitId,
                timestamp: Date.now()
            }
        };

        const notification = this.sendNotification(title, options);
        
        if (notification) {
            // Handle notification actions
            notification.addEventListener('click', (event) => {
                if (event.action === 'complete') {
                    habitManager.markComplete(habitId);
                    this.showToast(`${habit.name} marked as complete!`, 'success');
                } else if (event.action === 'snooze') {
                    // Snooze for 5 minutes
                    setTimeout(() => {
                        this.sendHabitReminder(habitId, message);
                    }, 5 * 60 * 1000);
                }
            });
        }
    }

    /**
     * Load and schedule all saved reminders
     */
    loadReminders() {
        const settings = storage.getSettings();
        const habits = habitManager.getHabits();

        habits.forEach(habit => {
            const reminderTime = settings.reminderTimes[habit.id];
            if (reminderTime && reminderTime.time) {
                this.scheduleReminder(habit.id, reminderTime.time, reminderTime.message);
            }
        });
    }

    /**
     * Clear all reminders
     */
    clearAllReminders() {
        Object.keys(this.reminderIntervals).forEach(habitId => {
            this.clearReminder(habitId);
        });
    }

    /**
     * Send achievement notification
     */
    sendAchievementNotification(achievement, habitId = null) {
        const habit = habitId ? habitManager.getHabit(habitId) : null;
        const title = 'Achievement Unlocked! 🎉';
        const body = habit ? `${achievement} for ${habit.name}!` : achievement;

        this.sendNotification(title, {
            body: body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            requireInteraction: false,
            tag: 'achievement'
        });
    }

    /**
     * Send streak notification
     */
    sendStreakNotification(habitId, streakCount) {
        const habit = habitManager.getHabit(habitId);
        if (!habit) return;

        const title = 'Streak Milestone! 🔥';
        const body = `Amazing! You've maintained ${habit.name} for ${streakCount} days!`;

        this.sendNotification(title, {
            body: body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            requireInteraction: false,
            tag: 'streak'
        });
    }

    /**
     * Send daily summary notification
     */
    sendDailySummary() {
        const stats = habitManager.getOverallStats();
        const title = 'Daily Habit Summary 📊';
        const body = `You completed ${stats.completedToday}/${stats.totalHabits} habits today (${stats.todayProgress}%)`;

        this.sendNotification(title, {
            body: body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            requireInteraction: false,
            tag: 'daily-summary'
        });
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toast = document.getElementById('notificationToast');
        const toastMessage = document.getElementById('toastMessage');
        
        if (!toast || !toastMessage) return;

        // Update message
        toastMessage.textContent = message;
        
        // Update alert class based on type
        const alertElement = toast.querySelector('.alert');
        if (alertElement) {
            alertElement.className = `alert alert-${type === 'success' ? 'success' : type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'info'}`;
        }
        
        // Show toast
        toast.classList.remove('hidden');
        
        // Hide after 3 seconds
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    /**
     * Update notification settings
     */
    updateSettings(updates) {
        const settings = storage.getSettings();
        const newSettings = { ...settings, ...updates };
        storage.saveSettings(newSettings);
    }

    /**
     * Load notification settings
     */
    loadSettings() {
        const settings = storage.getSettings();
        if (settings.notificationsEnabled && this.permission === 'granted') {
            this.loadReminders();
        }
    }

    /**
     * Get notification status
     */
    getStatus() {
        return {
            supported: 'Notification' in window,
            permission: this.permission,
            enabled: storage.getSettings().notificationsEnabled
        };
    }

    /**
     * Test notification
     */
    testNotification() {
        if (this.permission !== 'granted') {
            this.showToast('Please enable notifications first', 'warning');
            return false;
        }

        this.sendNotification('Test Notification', {
            body: 'This is a test notification from Habit Tracker!',
            icon: '/favicon.ico',
            badge: '/favicon.ico'
        });

        this.showToast('Test notification sent!', 'success');
        return true;
    }

    /**
     * Initialize notification system
     */
    init() {
        this.checkPermission();
        this.loadSettings();
        
        // Set up daily summary reminder (9 PM)
        this.scheduleDailySummary();
    }

    /**
     * Schedule daily summary notification
     */
    scheduleDailySummary() {
        const now = new Date();
        const summaryTime = new Date();
        summaryTime.setHours(21, 0, 0, 0); // 9 PM

        if (summaryTime <= now) {
            summaryTime.setDate(summaryTime.getDate() + 1);
        }

        const delay = summaryTime.getTime() - now.getTime();
        
        setTimeout(() => {
            this.sendDailySummary();
            // Schedule next daily summary
            this.scheduleDailySummary();
        }, delay);
    }
}

// Create global notification manager instance
const notificationManager = new NotificationManager(); 