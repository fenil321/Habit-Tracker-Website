/**
 * Charts Module - Handles Chart.js integration for visual progress tracking
 * Creates and manages various charts for habit analytics
 */

class ChartManager {
    constructor() {
        this.charts = {};
        this.chartColors = {
            primary: '#667eea',
            secondary: '#764ba2',
            success: '#48bb78',
            danger: '#f56565',
            warning: '#ed8936',
            info: '#4299e1',
            light: '#e2e8f0',
            dark: '#4a5568'
        };
        this.initCharts();
    }

    /**
     * Initialize all charts
     */
    initCharts() {
        this.createWeeklyChart();
        this.createMonthlyChart();
    }

    /**
     * Create weekly overview chart
     */
    createWeeklyChart() {
        const ctx = document.getElementById('weeklyChart');
        if (!ctx) return;

        // Destroy previous chart if exists
        if (this.charts.weekly) {
            this.charts.weekly.destroy();
        }

        this.charts.weekly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Completion Rate (%)',
                    data: [],
                    backgroundColor: this.chartColors.primary,
                    borderColor: this.chartColors.secondary,
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: this.chartColors.primary,
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return `Completion Rate: ${context.parsed.y}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            color: this.chartColors.light
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    /**
     * Create monthly progress chart
     */
    createMonthlyChart() {
        const ctx = document.getElementById('monthlyChart');
        if (!ctx) return;

        // Destroy previous chart if exists
        if (this.charts.monthly) {
            this.charts.monthly.destroy();
        }

        this.charts.monthly = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Daily Progress',
                    data: [],
                    borderColor: this.chartColors.success,
                    backgroundColor: this.chartColors.success + '20',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: this.chartColors.success,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: this.chartColors.success,
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return `Progress: ${context.parsed.y}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            color: this.chartColors.light
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    /**
     * Update weekly chart with new data
     */
    updateWeeklyChart() {
        if (!this.charts.weekly) return;

        const weekData = habitManager.getWeeklyProgress();
        const labels = weekData.map(day => day.dayName);
        const data = weekData.map(day => day.percentage);

        this.charts.weekly.data.labels = labels;
        this.charts.weekly.data.datasets[0].data = data;
        this.charts.weekly.update('active');
    }

    /**
     * Update monthly chart with new data
     */
    updateMonthlyChart() {
        if (!this.charts.monthly) return;

        const monthData = habitManager.getMonthlyProgress();
        const labels = monthData.map(day => day.day);
        const data = monthData.map(day => day.percentage);

        this.charts.monthly.data.labels = labels;
        this.charts.monthly.data.datasets[0].data = data;
        this.charts.monthly.update('active');
    }

    /**
     * Update all charts
     */
    updateAllCharts() {
        this.updateWeeklyChart();
        this.updateMonthlyChart();
    }

    /**
     * Create habit-specific progress chart
     */
    createHabitChart(habitId, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        // Create canvas element
        const canvas = document.createElement('canvas');
        canvas.id = `habit-chart-${habitId}`;
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        const habit = habitManager.getHabit(habitId);
        const completions = storage.getHabitCompletions(habitId, 30);

        const labels = completions.map((comp, index) => {
            const date = new Date(comp.date);
            return date.getDate();
        });

        const data = completions.map(comp => comp.completed ? 100 : 0);

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: habit.name,
                    data: data,
                    backgroundColor: data.map(value => 
                        value === 100 ? this.chartColors.success : this.chartColors.light
                    ),
                    borderColor: this.chartColors.primary,
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: this.chartColors.primary,
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return context.parsed.y === 100 ? 'Completed' : 'Missed';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            display: false
                        },
                        grid: {
                            display: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                animation: {
                    duration: 500
                }
            }
        });

        return chart;
    }

    /**
     * Create streak visualization chart
     */
    createStreakChart(habitId, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        const canvas = document.createElement('canvas');
        canvas.id = `streak-chart-${habitId}`;
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        const stats = habitManager.getHabitStats(habitId);
        
        if (!stats) return null;

        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Current Streak', 'Remaining'],
                datasets: [{
                    data: [stats.currentStreak, Math.max(0, stats.longestStreak - stats.currentStreak)],
                    backgroundColor: [
                        this.chartColors.success,
                        this.chartColors.light
                    ],
                    borderWidth: 0,
                    cutout: '70%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: this.chartColors.success,
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: false
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                }
            }
        });

        return chart;
    }

    /**
     * Create comparison chart for multiple habits
     */
    createComparisonChart(habitIds, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        const canvas = document.createElement('canvas');
        canvas.id = 'comparison-chart';
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        const datasets = [];
        const colors = [this.chartColors.primary, this.chartColors.success, this.chartColors.warning, this.chartColors.danger, this.chartColors.info];

        habitIds.forEach((habitId, index) => {
            const habit = habitManager.getHabit(habitId);
            const completions = storage.getHabitCompletions(habitId, 7);
            const data = completions.map(comp => comp.completed ? 100 : 0);

            datasets.push({
                label: habit.name,
                data: data,
                borderColor: colors[index % colors.length],
                backgroundColor: colors[index % colors.length] + '20',
                borderWidth: 2,
                fill: false,
                tension: 0.4
            });
        });

        const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderWidth: 1,
                        cornerRadius: 8
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            color: this.chartColors.light
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                }
            }
        });

        return chart;
    }

    /**
     * Destroy a specific chart
     */
    destroyChart(chartId) {
        if (this.charts[chartId]) {
            this.charts[chartId].destroy();
            delete this.charts[chartId];
        }
    }

    /**
     * Destroy all charts
     */
    destroyAllCharts() {
        Object.keys(this.charts).forEach(chartId => {
            this.destroyChart(chartId);
        });
    }

    /**
     * Get chart colors
     */
    getColors() {
        return this.chartColors;
    }

    /**
     * Set custom colors for charts
     */
    setColors(colors) {
        this.chartColors = { ...this.chartColors, ...colors };
        this.updateAllCharts();
    }
}

// Create global chart manager instance
const chartManager = new ChartManager(); 