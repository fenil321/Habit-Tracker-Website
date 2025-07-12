# Habit Tracker Web App

A comprehensive, responsive habit tracking web application built with HTML, CSS, and JavaScript. Track your daily and weekly habits, monitor streaks, view progress charts, and receive notifications to stay motivated.

## 🌟 Features

### Core Functionality
- **Habit Management**: Add, edit, and delete habits with custom descriptions
- **Frequency Support**: Track both daily and weekly habits
- **Completion Tracking**: Mark habits as complete for each day
- **Progress Visualization**: Interactive charts showing habit completion over time

### Statistics & Analytics
- **Current Streak**: Track consecutive days of habit completion
- **Longest Streak**: Record your best performance
- **Success Rates**: Calculate completion percentages for 7-day and 30-day periods
- **Overall Progress**: View comprehensive statistics across all habits

### Notifications & Reminders
- **Web Notifications API**: Browser-based notifications
- **Custom Reminder Times**: Set specific times for each habit
- **Custom Messages**: Personalize reminder messages
- **Streak Milestones**: Celebrate achievements with notifications
- **Daily Summaries**: Get overview of daily progress

### Data Management
- **localStorage Persistence**: All data saved locally in browser
- **Auto-save**: Automatic data saving every 30 seconds
- **Offline Support**: Works completely offline

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No server or backend required - runs entirely in the browser

### Installation
1. Download or clone the repository
2. Open `index.html` in your web browser
3. Start tracking your habits!

### First Time Setup
1. Click "Enable Notifications" to receive reminders
2. Click "Add Habit" to create your first habit
3. Fill in the habit details and set optional reminder time
4. Start marking your habits as complete each day

## 📱 Usage Guide

### Adding a New Habit
1. Click the "Add Habit" button
2. Enter habit name (required)
3. Add optional description
4. Select frequency (daily or weekly)
5. Set optional reminder time and message
6. Click "Save Habit"

### Tracking Daily Progress
- Click "Mark Done" on any habit card to mark it complete for today
- Click "Mark Incomplete" to undo today's completion
- View your current streak and success rates on each habit card

### Viewing Detailed Statistics
- Click "Details" on any habit card to see comprehensive statistics
- View current streak, longest streak, and success rates
- See a 7-day completion grid
- Access edit and delete options

### Setting Up Reminders
1. Enable notifications when prompted
2. Set a reminder time when creating or editing a habit
3. Customize the reminder message
4. Receive notifications at your specified time

### Managing Your Data
- All data is automatically saved to your browser's localStorage
- Use browser developer tools to access `window.debugApp` for advanced features:
  - `debugApp.exportData()` - Export all data
  - `debugApp.clearData()` - Clear all data
  - `debugApp.getStats()` - View app statistics
  - `debugApp.testNotification()` - Test notifications

## 🎨 Design Features

### Responsive Design
- Works perfectly on desktop, tablet, and mobile devices
- Adaptive layout that adjusts to screen size
- Touch-friendly interface for mobile users

## 📊 Technical Architecture

### Modular JavaScript Structure
- **storage.js**: Handles all localStorage operations
- **habits.js**: Manages habit logic and statistics
- **notifications.js**: Web Notifications API management
- **ui.js**: User interface interactions and DOM manipulation
- **app.js**: Main application lifecycle and coordination

### Data Structure
```javascript
// Habit Object
{
  id: "unique_id",
  name: "Habit Name",
  description: "Optional description",
  frequency: "daily" | "weekly",
  reminderTime: "HH:MM",
  reminderMessage: "Custom message",
  createdAt: "ISO date string",
  updatedAt: "ISO date string"
}

// Completion Data
{
  "habit_id": [
    {
      date: "YYYY-MM-DD",
      timestamp: "ISO date string"
    }
  ]
}
```

## 🔧 Browser Compatibility

- **Chrome**: 60+ (Full support)
- **Firefox**: 55+ (Full support)
- **Safari**: 12+ (Full support)
- **Edge**: 79+ (Full support)

### Required Features
- localStorage support
- ES6+ JavaScript features
- Web Notifications API (optional)

## 📈 Performance Features

- **Efficient Storage**: Optimized localStorage usage
- **Auto-save**: Prevents data loss
- **Memory Management**: Proper cleanup of intervals and timeouts

## 🛠️ Development

### File Structure
```
habit-tracker/
├── index.html          # Main HTML file
├── styles.css          # CSS styles
├── js/
│   ├── storage.js      # Storage management
│   ├── habits.js       # Habit logic
│   ├── notifications.js # Notification handling
│   ├── ui.js          # UI interactions
│   └── app.js         # Main application
└── README.md          # This file
```
