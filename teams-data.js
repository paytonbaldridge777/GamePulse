// College Football Teams Data with Statistics
// Data includes: Win-Loss record, Points Per Game (PPG), Points Allowed Per Game (PAPG), and Current Streak
// This file provides static fallback data and dynamic data loading from APIs

// Static fallback data (used when APIs are unavailable)
const staticTeamsData = {
    "Alabama": {
        wins: 10,
        losses: 2,
        ppg: 35.2,
        papg: 18.5,
        streak: 3, // positive = wins, negative = losses
        strength: 92
    },
    "Georgia": {
        wins: 11,
        losses: 1,
        ppg: 38.5,
        papg: 15.2,
        streak: 5,
        strength: 95
    },
    "Ohio State": {
        wins: 10,
        losses: 2,
        ppg: 36.8,
        papg: 19.3,
        streak: 4,
        strength: 91
    },
    "Michigan": {
        wins: 11,
        losses: 1,
        ppg: 34.7,
        papg: 17.8,
        streak: 6,
        strength: 93
    },
    "Texas": {
        wins: 9,
        losses: 3,
        ppg: 33.4,
        papg: 21.2,
        streak: 2,
        strength: 88
    },
    "Oklahoma": {
        wins: 8,
        losses: 4,
        ppg: 31.5,
        papg: 23.7,
        streak: -1,
        strength: 85
    },
    "USC": {
        wins: 9,
        losses: 3,
        ppg: 35.9,
        papg: 22.4,
        streak: 3,
        strength: 87
    },
    "Clemson": {
        wins: 8,
        losses: 4,
        ppg: 30.2,
        papg: 20.5,
        streak: -2,
        strength: 84
    },
    "Florida State": {
        wins: 10,
        losses: 2,
        ppg: 32.8,
        papg: 19.7,
        streak: 4,
        strength: 89
    },
    "Penn State": {
        wins: 9,
        losses: 3,
        ppg: 33.1,
        papg: 20.9,
        streak: 2,
        strength: 86
    },
    "Oregon": {
        wins: 10,
        losses: 2,
        ppg: 37.3,
        papg: 18.9,
        streak: 5,
        strength: 90
    },
    "LSU": {
        wins: 8,
        losses: 4,
        ppg: 32.4,
        papg: 22.8,
        streak: 1,
        strength: 85
    },
    "Notre Dame": {
        wins: 9,
        losses: 3,
        ppg: 31.7,
        papg: 21.5,
        streak: 3,
        strength: 87
    },
    "Washington": {
        wins: 10,
        losses: 2,
        ppg: 34.5,
        papg: 20.2,
        streak: 4,
        strength: 88
    },
    "Florida": {
        wins: 7,
        losses: 5,
        ppg: 28.9,
        papg: 24.3,
        streak: -1,
        strength: 82
    },
    "Tennessee": {
        wins: 8,
        losses: 4,
        ppg: 33.6,
        papg: 23.1,
        streak: 2,
        strength: 84
    },
    "Auburn": {
        wins: 7,
        losses: 5,
        ppg: 29.4,
        papg: 25.7,
        streak: -2,
        strength: 81
    },
    "Wisconsin": {
        wins: 8,
        losses: 4,
        ppg: 30.8,
        papg: 22.4,
        streak: 1,
        strength: 83
    },
    "Iowa": {
        wins: 8,
        losses: 4,
        ppg: 26.5,
        papg: 19.8,
        streak: 2,
        strength: 82
    },
    "Ole Miss": {
        wins: 8,
        losses: 4,
        ppg: 34.2,
        papg: 24.9,
        streak: 3,
        strength: 85
    },
    "Texas A&M": {
        wins: 7,
        losses: 5,
        ppg: 30.1,
        papg: 25.3,
        streak: -1,
        strength: 81
    },
    "Utah": {
        wins: 9,
        losses: 3,
        ppg: 32.7,
        papg: 21.8,
        streak: 3,
        strength: 86
    },
    "North Carolina": {
        wins: 8,
        losses: 4,
        ppg: 35.4,
        papg: 26.2,
        streak: 2,
        strength: 84
    },
    "Miami": {
        wins: 7,
        losses: 5,
        ppg: 31.8,
        papg: 26.5,
        streak: -2,
        strength: 80
    },
    "Kansas State": {
        wins: 8,
        losses: 4,
        ppg: 29.7,
        papg: 22.9,
        streak: 1,
        strength: 83
    },
    "Kentucky": {
        wins: 7,
        losses: 5,
        ppg: 27.3,
        papg: 23.6,
        streak: -1,
        strength: 80
    },
    "Mississippi State": {
        wins: 6,
        losses: 6,
        ppg: 28.6,
        papg: 27.4,
        streak: -3,
        strength: 78
    },
    "UCLA": {
        wins: 8,
        losses: 4,
        ppg: 33.9,
        papg: 24.1,
        streak: 2,
        strength: 84
    },
    "Oklahoma State": {
        wins: 7,
        losses: 5,
        ppg: 30.5,
        papg: 25.8,
        streak: 1,
        strength: 81
    },
    "Baylor": {
        wins: 6,
        losses: 6,
        ppg: 29.2,
        papg: 26.9,
        streak: -2,
        strength: 79
    }
};

// Dynamic teams data that will be populated from APIs
let teamsData = { ...staticTeamsData };
let isLoadingData = false;
let dataLoadError = null;

// Load team data from APIs
async function loadTeamsDataFromAPIs() {
    if (isLoadingData) {
        return; // Already loading
    }

    isLoadingData = true;
    dataLoadError = null;

    try {
        console.log('Attempting to load team data from sports APIs...');
        
        // Check if apiClient is available
        if (typeof apiClient === 'undefined') {
            throw new Error('API client not loaded');
        }

        const apiData = await apiClient.buildTeamData();
        
        if (apiData && Object.keys(apiData).length > 0) {
            // Merge API data with static data
            // Prefer API data, but keep static data for teams not in API
            teamsData = { ...staticTeamsData };
            
            // Update with API data
            Object.keys(apiData).forEach(teamName => {
                teamsData[teamName] = apiData[teamName];
            });
            
            console.log(`Successfully loaded data for ${Object.keys(apiData).length} teams from APIs`);
            return true;
        } else {
            console.warn('No data received from APIs, using static fallback data');
            teamsData = { ...staticTeamsData };
            return false;
        }
    } catch (error) {
        console.error('Error loading data from APIs:', error);
        dataLoadError = error.message;
        teamsData = { ...staticTeamsData };
        return false;
    } finally {
        isLoadingData = false;
    }
}

// Get current data source
function getDataSource() {
    if (JSON.stringify(teamsData) === JSON.stringify(staticTeamsData)) {
        return 'static';
    }
    return 'api';
}

// Refresh data from APIs
async function refreshTeamsData() {
    if (typeof apiClient !== 'undefined') {
        apiClient.clearCache();
    }
    return await loadTeamsDataFromAPIs();
}
