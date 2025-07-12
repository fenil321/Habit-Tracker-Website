/**
 * Storage Module - Handles all localStorage operations
 * Manages habits, completion logs, and app settings
 */

class StorageManager {
    constructor() {
        this.HABITS_KEY = 'habitTracker_habits';
        this.COMPLETIONS_KEY = 'habitTracker_completions';
        this.SETTINGS_KEY = 'habitTracker_settings';
        this.initializeStorage();
    }

    /**
     * Initialize storage with default values if empty
     */
    initializeStorage() {
        if (!this.getHabits()) {
            this.saveHabits([]);
        }
        if (!this.getCompletions()) {
            this.saveCompletions({});
        }
        if (!this.getSettings()) {
            this.saveSettings({
                notificationsEnabled: false,
                reminderTimes: {}
            });
        }
    }

    /**
     * Habit Management
     */
    getHabits() {
        try {
            const habits = localStorage.getItem(this.HABITS_KEY);
            return habits ? JSON.parse(habits) : [];
        } catch (error) {
            console.error('Error reading habits from storage:', error);
            return [];
        }
    }

    saveHabits(habits) {
        try {
            localStorage.setItem(this.HABITS_KEY, JSON.stringify(habits));
        } catch (error) {
            console.error('Error saving habits to storage:', error);
        }
    }

    addHabit(habit) {
        const habits = this.getHabits();
        habit.id = this.generateId();
        habit.createdAt = new Date().toISOString();
        habit.updatedAt = new Date().toISOString();
        habits.push(habit);
        this.saveHabits(habits);
        return habit;
    }

    updateHabit(habitId, updates) {
        const habits = this.getHabits();
        const index = habits.findIndex(h => h.id === habitId);
        if (index !== -1) {
            habits[index] = { ...habits[index], ...updates, updatedAt: new Date().toISOString() };
            this.saveHabits(habits);
            return habits[index];
        }
        return null;
    }

    deleteHabit(habitId) {
        const habits = this.getHabits();
        const filteredHabits = habits.filter(h => h.id !== habitId);
        this.saveHabits(filteredHabits);
        
        // Also remove completions for this habit
        const completions = this.getCompletions();
        delete completions[habitId];
        this.saveCompletions(completions);
    }

    getHabit(habitId) {
        const habits = this.getHabits();
        return habits.find(h => h.id === habitId);
    }

    /**
     * Completion Management
     */
    getCompletions() {
        try {
            const completions = localStorage.getItem(this.COMPLETIONS_KEY);
            return completions ? JSON.parse(completions) : {};
        } catch (error) {
            console.error('Error reading completions from storage:', error);
            return {};
        }
    }

    saveCompletions(completions) {
        try {
            localStorage.setItem(this.COMPLETIONS_KEY, JSON.stringify(completions));
        } catch (error) {
            console.error('Error saving completions to storage:', error);
        }
    }

    markHabitComplete(habitId, date = new Date().toISOString().split('T')[0]) {
        const completions = this.getCompletions();
        if (!completions[habitId]) {
            completions[habitId] = [];
        }
        
        // Check if already completed for this date
        const existingIndex = completions[habitId].findIndex(c => c.date === date);
        if (existingIndex === -1) {
            completions[habitId].push({ date, timestamp: new Date().toISOString() });
        }
        
        this.saveCompletions(completions);
    }

    markHabitIncomplete(habitId, date = new Date().toISOString().split('T')[0]) {
        const completions = this.getCompletions();
        if (completions[habitId]) {
            completions[habitId] = completions[habitId].filter(c => c.date !== date);
            this.saveCompletions(completions);
        }
    }

    isHabitCompleted(habitId, date = new Date().toISOString().split('T')[0]) {
        const completions = this.getCompletions();
        return completions[habitId] ? completions[habitId].some(c => c.date === date) : false;
    }

    getHabitCompletions(habitId, days = 30) {
        const completions = this.getCompletions();
        const habitCompletions = completions[habitId] || [];
        
        // Get dates for the last N days
        const dates = [];
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dates.push(date.toISOString().split('T')[0]);
        }
        
        return dates.map(date => ({
            date,
            completed: habitCompletions.some(c => c.date === date)
        }));
    }

    /**
     * Settings Management
     */
    getSettings() {
        try {
            const settings = localStorage.getItem(this.SETTINGS_KEY);
            return settings ? JSON.parse(settings) : {
                notificationsEnabled: false,
                reminderTimes: {}
            };
        } catch (error) {
            console.error('Error reading settings from storage:', error);
            return {
                notificationsEnabled: false,
                reminderTimes: {}
            };
        }
    }

    saveSettings(settings) {
        try {
            localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error('Error saving settings to storage:', error);
        }
    }

    updateSettings(updates) {
        const settings = this.getSettings();
        const newSettings = { ...settings, ...updates };
        this.saveSettings(newSettings);
        return newSettings;
    }

    /**
     * Utility Methods
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Data Export/Import
     */
    exportData() {
        return {
            habits: this.getHabits(),
            completions: this.getCompletions(),
            settings: this.getSettings(),
            exportDate: new Date().toISOString()
        };
    }

    importData(data) {
        try {
            if (data.habits) this.saveHabits(data.habits);
            if (data.completions) this.saveCompletions(data.completions);
            if (data.settings) this.saveSettings(data.settings);
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    /**
     * Clear all data
     */
    clearAllData() {
        localStorage.removeItem(this.HABITS_KEY);
        localStorage.removeItem(this.COMPLETIONS_KEY);
        localStorage.removeItem(this.SETTINGS_KEY);
        this.initializeStorage();
    }

    /**
     * Get storage statistics
     */
    getStorageStats() {
        const habits = this.getHabits();
        const completions = this.getCompletions();
        
        let totalCompletions = 0;
        Object.values(completions).forEach(habitCompletions => {
            totalCompletions += habitCompletions.length;
        });

        return {
            totalHabits: habits.length,
            totalCompletions,
            storageSize: JSON.stringify({
                habits,
                completions,
                settings: this.getSettings()
            }).length
        };
    }
}

// Create global storage instance
const storage = new StorageManager(); 