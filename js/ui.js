/**
 * UI Module - Handles all user interface interactions
 * Manages modals, form handling, and dynamic content updates
 */

class UIManager {
    constructor() {
        this.currentEditingHabit = null;
        this.initializeEventListeners();
    }

    /**
     * Initialize all event listeners
     */
    initializeEventListeners() {
        // Add habit button
        const addHabitBtn = document.getElementById('addHabitBtn');
        if (addHabitBtn) {
            addHabitBtn.addEventListener('click', () => this.showAddHabitModal());
        }

        // Notification button
        const notificationBtn = document.getElementById('notificationBtn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => this.handleNotificationPermission());
        }

        // Modal close buttons
        const closeModal = document.getElementById('closeModal');
        const closeDetailsModal = document.getElementById('closeDetailsModal');
        const cancelBtn = document.getElementById('cancelBtn');

        if (closeModal) {
            closeModal.addEventListener('click', () => this.closeModal('habitModal'));
        }
        if (closeDetailsModal) {
            closeDetailsModal.addEventListener('click', () => this.closeModal('detailsModal'));
        }
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeModal('habitModal'));
        }

        // Habit form submission
        const habitForm = document.getElementById('habitForm');
        if (habitForm) {
            habitForm.addEventListener('submit', (e) => this.handleHabitFormSubmit(e));
        }

        // Close modals when clicking outside (DaisyUI modal backdrop)
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });

        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    /**
     * Show add habit modal
     */
    showAddHabitModal() {
        this.currentEditingHabit = null;
        this.resetHabitForm();
        this.openModal('habitModal');
        document.getElementById('modalTitle').textContent = 'Add New Habit';
        document.getElementById('habitForm').querySelector('button[type="submit"]').textContent = 'Save Habit';
    }

    /**
     * Show edit habit modal
     */
    showEditHabitModal(habitId) {
        this.closeModal('detailsModal'); // Ensure details modal is closed first
        const habit = habitManager.getHabit(habitId);
        if (!habit) return;

        this.currentEditingHabit = habit;
        this.populateHabitForm(habit);
        this.openModal('habitModal');
        document.getElementById('modalTitle').textContent = 'Edit Habit';
        document.getElementById('habitForm').querySelector('button[type="submit"]').textContent = 'Update Habit';
    }

    /**
     * Show habit details modal
     */
    showHabitDetailsModal(habitId) {
        const habit = habitManager.getHabit(habitId);
        if (!habit) return;

        const stats = habitManager.getHabitStats(habitId);
        this.populateHabitDetails(habit, stats);
        this.openModal('detailsModal');
    }

    /**
     * Open modal by ID
     */
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('modal-open');
            document.body.style.overflow = 'hidden';
            
            // Focus first input if exists
            const firstInput = modal.querySelector('input, textarea, select');
            if (firstInput) {
                firstInput.focus();
            }
        }
    }

    /**
     * Close modal by ID
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('modal-open');
            document.body.style.overflow = 'auto';
        }
    }

    /**
     * Close all modals
     */
    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('modal-open');
        });
        document.body.style.overflow = 'auto';
    }

    /**
     * Reset habit form
     */
    resetHabitForm() {
        const form = document.getElementById('habitForm');
        if (form) {
            form.reset();
            document.getElementById('habitName').value = '';
            document.getElementById('habitDescription').value = '';
            document.getElementById('habitFrequency').value = 'daily';
            document.getElementById('reminderTime').value = '';
            document.getElementById('reminderMessage').value = 'Time to complete your habit!';
            document.getElementById('habitTags').value = '';
        }
    }

    /**
     * Populate habit form with existing data
     */
    populateHabitForm(habit) {
        document.getElementById('habitName').value = habit.name || '';
        document.getElementById('habitDescription').value = habit.description || '';
        document.getElementById('habitFrequency').value = habit.frequency || 'daily';
        document.getElementById('reminderTime').value = habit.reminderTime || '';
        document.getElementById('reminderMessage').value = habit.reminderMessage || 'Time to complete your habit!';
        document.getElementById('habitTags').value = (habit.tags || []).join(', ');
    }

    /**
     * Handle habit form submission
     */
    handleHabitFormSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const tagsRaw = document.getElementById('habitTags').value;
        const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);
        const habitData = {
            name: formData.get('habitName') || document.getElementById('habitName').value,
            description: formData.get('habitDescription') || document.getElementById('habitDescription').value,
            frequency: formData.get('habitFrequency') || document.getElementById('habitFrequency').value,
            reminderTime: document.getElementById('reminderTime').value,
            reminderMessage: document.getElementById('reminderMessage').value,
            tags: tags
        };

        // Validate form data
        const validation = habitManager.validateHabitData(habitData);
        if (!validation.isValid) {
            this.showToast(validation.errors.join(', '), 'error');
            return;
        }

        try {
            if (this.currentEditingHabit) {
                // Update existing habit
                const updatedHabit = habitManager.updateHabit(this.currentEditingHabit.id, habitData);
                if (updatedHabit) {
                    this.showToast('Habit updated successfully!', 'success');
                    this.closeModal('habitModal');
                    this.refreshUI();
                }
            } else {
                // Add new habit
                const newHabit = habitManager.addHabit(habitData);
                if (newHabit) {
                    this.showToast('Habit added successfully!', 'success');
                    this.closeModal('habitModal');
                    this.refreshUI();
                }
            }

            // Schedule reminder if time is set
            if (habitData.reminderTime) {
                const habitId = this.currentEditingHabit ? this.currentEditingHabit.id : habitManager.getHabits().slice(-1)[0]?.id;
                if (habitId) {
                    notificationManager.scheduleReminder(habitId, habitData.reminderTime, habitData.reminderMessage);
                }
            }

        } catch (error) {
            console.error('Error saving habit:', error);
            this.showToast('Error saving habit. Please try again.', 'error');
        }
    }

    /**
     * Handle notification permission request
     */
    async handleNotificationPermission() {
        const success = await notificationManager.requestPermission();
        if (success) {
            document.getElementById('notificationBtn').textContent = 'Notifications Enabled';
            document.getElementById('notificationBtn').classList.add('btn-success');
        }
    }

    /**
     * Populate habit details modal
     */
    populateHabitDetails(habit, stats) {
        const detailsContainer = document.getElementById('habitDetails');
        if (!detailsContainer) return;

        const completions = storage.getHabitCompletions(habit.id, 7);
        const completionGrid = this.createCompletionGrid(completions);

        detailsContainer.innerHTML = `
            <div class="space-y-6">
                <div class="card bg-base-200">
                    <div class="card-body">
                        <h3 class="card-title text-primary">${habit.name}</h3>
                        ${habit.description ? `<p class="text-base-content/70">${habit.description}</p>` : ''}
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span class="font-semibold">Frequency:</span> ${habit.frequency}
                            </div>
                            ${habit.reminderTime ? `<div><span class="font-semibold">Reminder:</span> ${habit.reminderTime}</div>` : ''}
                        </div>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="stat bg-base-200 rounded-lg p-4">
                        <div class="stat-title text-xs">Current Streak</div>
                        <div class="stat-value text-lg text-primary">${stats.currentStreak} days</div>
                    </div>
                    <div class="stat bg-base-200 rounded-lg p-4">
                        <div class="stat-title text-xs">Longest Streak</div>
                        <div class="stat-value text-lg text-primary">${stats.longestStreak} days</div>
                    </div>
                    <div class="stat bg-base-200 rounded-lg p-4">
                        <div class="stat-title text-xs">30-Day Success</div>
                        <div class="stat-value text-lg text-primary">${stats.completionRate30}%</div>
                    </div>
                    <div class="stat bg-base-200 rounded-lg p-4">
                        <div class="stat-title text-xs">7-Day Success</div>
                        <div class="stat-value text-lg text-primary">${stats.completionRate7}%</div>
                    </div>
                </div>
                
                <div class="card bg-base-200">
                    <div class="card-body">
                        <h4 class="card-title text-sm">Last 7 Days</h4>
                        ${completionGrid}
                    </div>
                </div>
                
                <div class="flex gap-3 justify-center">
                    <button class="btn btn-primary" onclick="uiManager.toggleHabitCompletion('${habit.id}')">
                        ${habitManager.isCompleted(habit.id) ? 'Mark Incomplete' : 'Mark Complete'}
                    </button>
                    <button class="btn btn-outline" onclick="uiManager.showEditHabitModal('${habit.id}')">
                        Edit Habit
                    </button>
                    <button class="btn btn-error" onclick="uiManager.deleteHabit('${habit.id}')">
                        Delete Habit
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Create completion grid for habit details
     */
    createCompletionGrid(completions) {
        const today = new Date().toISOString().split('T')[0];
        
        return `
            <div class="grid grid-cols-7 gap-1">
                ${completions.map(completion => {
                    const date = new Date(completion.date);
                    const isToday = completion.date === today;
                    const isCompleted = completion.completed;
                    
                    return `
                        <div class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${
                            isCompleted 
                                ? 'bg-success text-success-content' 
                                : 'bg-base-300 text-base-content/60'
                        } ${isToday ? 'ring-2 ring-primary' : ""}" 
                             title="${date.toLocaleDateString()}">
                            ${date.getDate()}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    /**
     * Toggle habit completion for today
     */
    toggleHabitCompletion(habitId) {
        const isCompleted = habitManager.isCompleted(habitId);
        const habit = habitManager.getHabit(habitId);
        // Confirmation popup before marking as done
        if (!isCompleted) {
            if (!confirm(`Mark '${habit.name}' as done for today?`)) {
                return;
            }
        }
        if (isCompleted) {
            habitManager.markIncomplete(habitId);
            this.showToast(`${habit.name} marked as incomplete`, 'info');
        } else {
            habitManager.markComplete(habitId);
            this.showToast(`${habit.name} marked as complete!`, 'success');
            
            // Check for streak milestones
            const stats = habitManager.getHabitStats(habitId);
            if (stats.currentStreak % 7 === 0 && stats.currentStreak > 0) {
                notificationManager.sendStreakNotification(habitId, stats.currentStreak);
            }
            // Confetti if all habits are done for today
            setTimeout(() => {
              const habits = habitManager.getHabits();
              const allDone = habits.length > 0 && habits.every(h => habitManager.isCompleted(h.id));
              if (allDone && window.confetti) {
                window.confetti({
                  particleCount: 120,
                  spread: 80,
                  origin: { y: 0.7 },
                  colors: ['#a78bfa', '#38bdf8', '#f472b6', '#facc15', '#34d399']
                });
              }
            }, 300);
        }
        
        this.refreshUI();
    }

    /**
     * Delete habit with confirmation
     */
    deleteHabit(habitId) {
        const habit = habitManager.getHabit(habitId);
        if (!habit) return;

        if (confirm(`Are you sure you want to delete "${habit.name}"? This action cannot be undone.`)) {
            habitManager.deleteHabit(habitId);
            notificationManager.clearReminder(habitId);
            this.showToast('Habit deleted successfully', 'success');
            this.closeModal('detailsModal');
            this.refreshUI();
        }
    }

    /**
     * Render habits list
     */
    renderHabitsList() {
        const habitsList = document.getElementById('habitsList');
        if (!habitsList) return;

        const habits = habitManager.getHabits();
        
        if (habits.length === 0) {
            habitsList.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-6xl text-primary mb-4">
                        <i class="fas fa-plus-circle"></i>
                    </div>
                    <h3 class="text-2xl font-bold text-primary mb-2">No habits yet</h3>
                    <p class="text-base-content/70 mb-6">Start building your habits by adding your first one!</p>
                    <button class="btn btn-primary btn-lg" onclick="uiManager.showAddHabitModal()">
                        <i class="fas fa-plus"></i> Add Your First Habit
                    </button>
                </div>
            `;
            return;
        }

        habitsList.innerHTML = habits.map(habit => {
            const stats = habitManager.getHabitStats(habit.id);
            const isCompletedToday = habitManager.isCompleted(habit.id);
            const completions = storage.getHabitCompletions(habit.id, 7);
            
            return this.createHabitCard(habit, stats, isCompletedToday, completions);
        }).join('');
    }

    /**
     * Create habit card HTML
     */
    createHabitCard(habit, stats, isCompletedToday, completions) {
        const completionGrid = this.createCompletionGrid(completions);
        // Simple emoji/icon based on habit name (can be improved for user selection)
        const emoji = habit.name.toLowerCase().includes('jog') ? '🏃' :
                      habit.name.toLowerCase().includes('read') ? '📚' :
                      habit.name.toLowerCase().includes('meditat') ? '🧘' :
                      habit.name.toLowerCase().includes('drink') ? '💧' :
                      habit.name.toLowerCase().includes('sleep') ? '😴' :
                      habit.name.toLowerCase().includes('code') ? '💻' :
                      '🌟';
        // Progress ring SVG for 30-day success
        const percent = stats.completionRate30;
        const radius = 24, stroke = 5, norm = 2 * Math.PI * radius;
        const progressRing = `
          <svg width="60" height="60" class="mx-auto mb-2">
            <circle cx="30" cy="30" r="${radius}" stroke="#22223b" stroke-width="${stroke}" fill="none"/>
            <circle cx="30" cy="30" r="${radius}" stroke="url(#grad)" stroke-width="${stroke}" fill="none"
              stroke-dasharray="${norm}" stroke-dashoffset="${norm - (percent/100)*norm}"
              stroke-linecap="round" style="transition: stroke-dashoffset 0.7s cubic-bezier(.4,2,.6,1);"/>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#a78bfa"/>
                <stop offset="100%" stop-color="#38bdf8"/>
              </linearGradient>
            </defs>
            <text x="50%" y="54%" text-anchor="middle" class="progress-text" font-size="1.1rem" font-weight="bold">${percent}%</text>
          </svg>`;
        // Tag badges
        const tagBadges = (habit.tags || []).map(tag => `<span class='badge badge-accent badge-sm mr-1'>${tag}</span>`).join('');
        return `
          <div class="card bg-base-100 shadow-xl mb-8 hover:shadow-2xl hover:ring-2 hover:ring-primary/40 transition-all duration-300 group" data-habit-id="${habit.id}">
            <div class="card-body">
              <div class="flex items-center gap-4 mb-4">
                <div class="text-4xl">${emoji}</div>
                <div class="flex-1">
                  <h3 class="card-title text-primary text-lg font-bold flex items-center gap-2">${habit.name}</h3>
                  ${habit.description ? `<p class="text-base-content/70 text-sm">${habit.description}</p>` : ''}
                  <div class="flex gap-2 mt-1 flex-wrap">${tagBadges}</div>
                  <div class="flex gap-2 mt-1">
                    <span class="badge badge-outline badge-sm" title="How often you want to do this habit">${habit.frequency}</span>
                  </div>
                </div>
                <div class="flex flex-col items-center">
                  ${progressRing}
                  <span class="text-xs text-base-content/60 mt-1" title="30-day completion rate">30d Success</span>
                </div>
              </div>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div class="stat bg-base-200 rounded-lg p-3" title="Current streak: consecutive days completed">
                  <div class="stat-title text-xs flex items-center gap-1">🔥<span>Streak</span></div>
                  <div class="stat-value text-lg text-primary transition-all duration-500">${stats.currentStreak}d</div>
                </div>
                <div class="stat bg-base-200 rounded-lg p-3" title="Longest streak ever achieved">
                  <div class="stat-title text-xs flex items-center gap-1">🏅<span>Best</span></div>
                  <div class="stat-value text-lg text-primary">${stats.longestStreak}d</div>
                </div>
                <div class="stat bg-base-200 rounded-lg p-3" title="Success rate over the last 7 days">
                  <div class="stat-title text-xs flex items-center gap-1">📆<span>7d</span></div>
                  <div class="stat-value text-lg text-primary">${stats.completionRate7}%</div>
                </div>
                <div class="stat bg-base-200 rounded-lg p-3" title="Success rate over the last 30 days">
                  <div class="stat-title text-xs flex items-center gap-1">📅<span>30d</span></div>
                  <div class="stat-value text-lg text-primary">${stats.completionRate30}%</div>
                </div>
              </div>
              <div class="border-t border-base-300 pt-4">
                <h4 class="text-sm font-medium mb-3">Last 7 Days <span class="tooltip tooltip-bottom ml-1" data-tip="Shows your completion for each day">🛈</span></h4>
                <div class="flex gap-1 justify-center">
                  ${completions.map(completion => {
                    const date = new Date(completion.date);
                    const isToday = completion.date === new Date().toISOString().split('T')[0];
                    const isCompleted = completion.completed;
                    return `<div class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium cursor-pointer transition-all duration-200 ${isCompleted ? 'bg-success text-success-content' : 'bg-base-300 text-base-content/60'} ${isToday ? 'ring-2 ring-primary' : ''} hover:scale-110" title="${date.toLocaleDateString()} - ${isCompleted ? 'Completed' : 'Missed'}">${date.getDate()}</div>`;
                  }).join('')}
                </div>
              </div>
              <div class="flex gap-2 mt-4">
                <button class="btn btn-primary btn-sm flex-1 group/done relative overflow-hidden" onclick="uiManager.toggleHabitCompletion('${habit.id}')" title="Mark as done">
                  <span class="transition-transform duration-300 group-hover/done:scale-110">${isCompletedToday ? '<i class=\'fas fa-check\'></i> Done' : '<i class=\'fas fa-check\'></i> Mark Done'}</span>
                  <span class="absolute inset-0 opacity-0 group-active/done:opacity-100 transition-opacity duration-300 flex items-center justify-center text-2xl">✔️</span>
                </button>
                <button class="btn btn-outline btn-sm" onclick="uiManager.showHabitDetailsModal('${habit.id}')" title="View details"><i class="fas fa-chart-bar"></i></button>
                <button class="btn btn-outline btn-sm" onclick="uiManager.showEditHabitModal('${habit.id}')" title="Edit habit"><i class="fas fa-edit"></i></button>
              </div>
            </div>
          </div>
        `;
    }

    /**
     * Update overall statistics display
     */
    updateStatsDisplay() {
        const stats = habitManager.getOverallStats();
        
        document.getElementById('totalHabits').textContent = stats.totalHabits;
        document.getElementById('todayProgress').textContent = `${stats.todayProgress}%`;
        document.getElementById('bestStreak').textContent = `${stats.bestStreak} days`;
        document.getElementById('overallSuccess').textContent = `${stats.overallSuccess}%`;
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        notificationManager.showToast(message, type);
    }

    /**
     * Refresh entire UI
     */
    refreshUI() {
        this.renderHabitsList();
        this.updateStatsDisplay();
    }

    /**
     * Initialize UI
     */
    init() {
        this.refreshUI();
        notificationManager.init();
    }
}

// Create global UI manager instance
const uiManager = new UIManager(); 

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.classList.remove('modal-open');
  });
  // Motivational quotes
  const quotes = [
    "Small habits make a big difference.",
    "Progress, not perfection!",
    "Every day is a fresh start.",
    "Consistency is the key to success.",
    "You are your only limit.",
    "Great things are done by a series of small things brought together.",
    "Stay positive, work hard, make it happen!",
    "Success is the sum of small efforts repeated day in and day out."
  ];
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  const quoteEl = document.getElementById('motivationQuote');
  if (quoteEl) quoteEl.textContent = quote;

  // Theme toggle logic
  const html = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const getSystemTheme = () => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const getStoredTheme = () => localStorage.getItem('theme');
  const setTheme = (theme) => {
    if (theme === 'dark') {
      html.classList.add('dark');
      html.setAttribute('data-theme', 'dark');
      themeToggle.classList.remove('light');
      themeToggle.classList.add('dark');
    } else {
      html.classList.remove('dark');
      html.setAttribute('data-theme', 'light');
      themeToggle.classList.remove('dark');
      themeToggle.classList.add('light');
    }
  };
  // On load
  let theme = getStoredTheme() || getSystemTheme();
  setTheme(theme);
  // Toggle handler
  themeToggle.addEventListener('click', () => {
    theme = (html.classList.contains('dark')) ? 'light' : 'dark';
    setTheme(theme);
    localStorage.setItem('theme', theme);
    // Refresh UI to update progress ring text colors
    if (window.uiManager) {
      setTimeout(() => {
        window.uiManager.refreshUI();
      }, 100); // Small delay to ensure theme change is applied
    }
  });
}); 

// Add confetti script if not present
if (!document.getElementById('confetti-script')) {
  const script = document.createElement('script');
  script.id = 'confetti-script';
  script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
  document.head.appendChild(script);
} 