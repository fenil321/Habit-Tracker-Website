/**
 * Habits Module - Handles habit management and statistics
 * Calculates streaks, success rates, and habit analytics
 */

class HabitManager {
    constructor() {
        this.habits = [];
        this.loadHabits();
    }

    /**
     * Load habits from storage
     */
    loadHabits() {
        this.habits = storage.getHabits();
    }

    /**
     * Get all habits
     */
    getHabits() {
        return this.habits;
    }

    /**
     * Get habit by ID
     */
    getHabit(habitId) {
        return this.habits.find(h => h.id === habitId);
    }

    /**
     * Add new habit
     */
    addHabit(habitData) {
        const habit = storage.addHabit(habitData);
        this.habits.push(habit);
        return habit;
    }

    /**
     * Update habit
     */
    updateHabit(habitId, updates) {
        const updatedHabit = storage.updateHabit(habitId, updates);
        if (updatedHabit) {
            const index = this.habits.findIndex(h => h.id === habitId);
            if (index !== -1) {
                this.habits[index] = updatedHabit;
            }
        }
        return updatedHabit;
    }

    /**
     * Delete habit
     */
    deleteHabit(habitId) {
        storage.deleteHabit(habitId);
        this.habits = this.habits.filter(h => h.id !== habitId);
    }

    /**
     * Mark habit as complete for a specific date
     */
    markComplete(habitId, date = new Date().toISOString().split('T')[0]) {
        storage.markHabitComplete(habitId, date);
    }

    /**
     * Mark habit as incomplete for a specific date
     */
    markIncomplete(habitId, date = new Date().toISOString().split('T')[0]) {
        storage.markHabitIncomplete(habitId, date);
    }

    /**
     * Check if habit is completed for a specific date
     */
    isCompleted(habitId, date = new Date().toISOString().split('T')[0]) {
        return storage.isHabitCompleted(habitId, date);
    }

    /**
     * Calculate current streak for a habit
     */
    calculateCurrentStreak(habitId) {
        const completions = storage.getHabitCompletions(habitId, 365); // Check last year
        let streak = 0;
        const today = new Date().toISOString().split('T')[0];
        
        // Start from today and go backwards
        for (let i = 0; i < completions.length; i++) {
            const completion = completions[i];
            if (completion.completed) {
                streak++;
            } else {
                break; // Streak broken
            }
        }
        
        return streak;
    }

    /**
     * Calculate longest streak for a habit
     */
    calculateLongestStreak(habitId) {
        const completions = storage.getHabitCompletions(habitId, 365);
        let longestStreak = 0;
        let currentStreak = 0;
        
        for (const completion of completions) {
            if (completion.completed) {
                currentStreak++;
                longestStreak = Math.max(longestStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
        }
        
        return longestStreak;
    }

    /**
     * Calculate completion rate for a habit
     */
    calculateCompletionRate(habitId, days = 30) {
        const completions = storage.getHabitCompletions(habitId, days);
        const completedDays = completions.filter(c => c.completed).length;
        return Math.round((completedDays / days) * 100);
    }

    /**
     * Get habit statistics
     */
    getHabitStats(habitId) {
        const habit = this.getHabit(habitId);
        if (!habit) return null;

        const currentStreak = this.calculateCurrentStreak(habitId);
        const longestStreak = this.calculateLongestStreak(habitId);
        const completionRate30 = this.calculateCompletionRate(habitId, 30);
        const completionRate7 = this.calculateCompletionRate(habitId, 7);
        
        return {
            habit,
            currentStreak,
            longestStreak,
            completionRate30,
            completionRate7,
            totalCompletions: storage.getHabitCompletions(habitId, 365).filter(c => c.completed).length
        };
    }

    /**
     * Get overall app statistics
     */
    getOverallStats() {
        const today = new Date().toISOString().split('T')[0];
        let totalHabits = this.habits.length;
        let completedToday = 0;
        let bestStreak = 0;
        let totalCompletions = 0;
        let totalPossibleDays = 0;

        this.habits.forEach(habit => {
            // Count today's completions
            if (storage.isHabitCompleted(habit.id, today)) {
                completedToday++;
            }

            // Get habit stats
            const stats = this.getHabitStats(habit.id);
            if (stats) {
                bestStreak = Math.max(bestStreak, stats.longestStreak);
                totalCompletions += stats.totalCompletions;
            }

            // Calculate total possible days (since habit creation)
            const createdDate = new Date(habit.createdAt);
            const daysSinceCreation = Math.ceil((new Date() - createdDate) / (1000 * 60 * 60 * 24));
            totalPossibleDays += Math.min(daysSinceCreation, 365); // Cap at 1 year
        });

        const todayProgress = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;
        const overallSuccess = totalPossibleDays > 0 ? Math.round((totalCompletions / totalPossibleDays) * 100) : 0;

        return {
            totalHabits,
            todayProgress,
            bestStreak,
            overallSuccess,
            completedToday,
            totalCompletions
        };
    }

    /**
     * Get weekly progress data for charts
     */
    getWeeklyProgress() {
        const weekData = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            let completedHabits = 0;
            this.habits.forEach(habit => {
                if (storage.isHabitCompleted(habit.id, dateStr)) {
                    completedHabits++;
                }
            });
            
            weekData.push({
                date: dateStr,
                dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
                completed: completedHabits,
                total: this.habits.length,
                percentage: this.habits.length > 0 ? Math.round((completedHabits / this.habits.length) * 100) : 0
            });
        }
        
        return weekData;
    }

    /**
     * Get monthly progress data for charts
     */
    getMonthlyProgress() {
        const monthData = [];
        const today = new Date();
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            let completedHabits = 0;
            this.habits.forEach(habit => {
                if (storage.isHabitCompleted(habit.id, dateStr)) {
                    completedHabits++;
                }
            });
            
            monthData.push({
                date: dateStr,
                day: date.getDate(),
                completed: completedHabits,
                total: this.habits.length,
                percentage: this.habits.length > 0 ? Math.round((completedHabits / this.habits.length) * 100) : 0
            });
        }
        
        return monthData;
    }

    /**
     * Get habits that need attention (low completion rate or broken streaks)
     */
    getHabitsNeedingAttention() {
        return this.habits.filter(habit => {
            const stats = this.getHabitStats(habit.id);
            if (!stats) return false;
            
            // Habits with low completion rate or broken streaks
            return stats.completionRate30 < 50 || stats.currentStreak === 0;
        });
    }

    /**
     * Get top performing habits
     */
    getTopPerformingHabits(limit = 5) {
        const habitsWithStats = this.habits.map(habit => ({
            habit,
            stats: this.getHabitStats(habit.id)
        })).filter(item => item.stats);

        return habitsWithStats
            .sort((a, b) => b.stats.completionRate30 - a.stats.completionRate30)
            .slice(0, limit);
    }

    /**
     * Validate habit data
     */
    validateHabitData(habitData) {
        const errors = [];
        
        if (!habitData.name || habitData.name.trim().length === 0) {
            errors.push('Habit name is required');
        }
        
        if (!habitData.frequency || !['daily', 'weekly'].includes(habitData.frequency)) {
            errors.push('Valid frequency is required (daily or weekly)');
        }
        
        if (habitData.name && habitData.name.trim().length > 100) {
            errors.push('Habit name is too long (max 100 characters)');
        }
        
        if (habitData.description && habitData.description.length > 500) {
            errors.push('Description is too long (max 500 characters)');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Get habit completion history for a specific date range
     */
    getHabitHistory(habitId, startDate, endDate) {
        const completions = storage.getHabitCompletions(habitId, 365);
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return completions.filter(completion => {
            const completionDate = new Date(completion.date);
            return completionDate >= start && completionDate <= end;
        });
    }

    /**
     * Export habit data for backup
     */
    exportHabitData(habitId) {
        const habit = this.getHabit(habitId);
        if (!habit) return null;
        
        const completions = storage.getHabitCompletions(habitId, 365);
        const stats = this.getHabitStats(habitId);
        
        return {
            habit,
            completions,
            stats,
            exportDate: new Date().toISOString()
        };
    }
}

// Create global habit manager instance
const habitManager = new HabitManager(); 