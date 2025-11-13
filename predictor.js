// GamePulse Score Predictor Logic

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    // Show loading state
    showLoadingState();
    
    // Try to load data from APIs
    try {
        await loadTeamsDataFromAPIs();
    } catch (error) {
        console.error('Failed to load API data:', error);
    }
    
    // Populate selectors with available data
    populateTeamSelectors();
    
    // Hide loading state
    hideLoadingState();
    
    // Show data source indicator
    updateDataSourceIndicator();
    
    document.getElementById('predictBtn').addEventListener('click', predictScore);
    
    // Add refresh button handler if it exists
    const refreshBtn = document.getElementById('refreshDataBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshData);
    }
});

// Show loading state
function showLoadingState() {
    const container = document.querySelector('.container');
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loadingState';
    loadingDiv.className = 'loading-state';
    loadingDiv.innerHTML = `
        <div class="loading-spinner"></div>
        <p>Loading team data from sports APIs...</p>
    `;
    container.insertBefore(loadingDiv, container.firstChild);
}

// Hide loading state
function hideLoadingState() {
    const loadingDiv = document.getElementById('loadingState');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// Update data source indicator
function updateDataSourceIndicator() {
    const dataInfo = getDataSourceInfo();
    const source = dataInfo.source;
    const indicator = document.getElementById('dataSourceIndicator');
    
    if (indicator) {
        if (source === 'api') {
            indicator.innerHTML = '✅ Using live API data';
            indicator.className = 'data-source api-data';
            console.log('[UI] Data source indicator: Live API data');
        } else {
            indicator.innerHTML = '📊 Using static fallback data - <a href="#" id="showErrorDetails" style="color: inherit; text-decoration: underline;">Why?</a>';
            indicator.className = 'data-source static-data';
            console.log('[UI] Data source indicator: Static fallback data');
            
            // Add click handler to show error details
            setTimeout(() => {
                const showErrorLink = document.getElementById('showErrorDetails');
                if (showErrorLink) {
                    showErrorLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        showErrorDetailsPanel(dataInfo);
                    });
                }
            }, 0);
        }
    }
}

// Show detailed error information panel
function showErrorDetailsPanel(dataInfo) {
    // Remove existing panel if present
    const existingPanel = document.getElementById('errorDetailsPanel');
    if (existingPanel) {
        existingPanel.remove();
    }

    const panel = document.createElement('div');
    panel.id = 'errorDetailsPanel';
    panel.className = 'error-details-panel';
    
    let errorHtml = `
        <div class="error-panel-header">
            <h3>⚠️ Why is the app using static fallback data?</h3>
            <button id="closeErrorPanel" class="close-btn">&times;</button>
        </div>
        <div class="error-panel-content">
            <p><strong>Status:</strong> Unable to fetch live data from sports APIs</p>
    `;

    // Add error summary if available
    if (dataInfo.errorSummary) {
        const summary = dataInfo.errorSummary;
        const guidance = summary.guidance;
        
        errorHtml += `
            <div class="error-section">
                <p><strong>📊 Error Summary:</strong></p>
                <ul>
                    <li>Total errors encountered: ${summary.totalErrors}</li>
                    <li>Most common issue: ${summary.mostCommonError}</li>
                </ul>
            </div>

            <div class="error-section">
                <p><strong>❌ Issue:</strong> ${guidance.message}</p>
            </div>

            <div class="error-section">
                <p><strong>🔍 Possible Reasons:</strong></p>
                <ul>
                    ${guidance.reasons.map(reason => `<li>${reason}</li>`).join('')}
                </ul>
            </div>

            <div class="error-section">
                <p><strong>💡 Suggested Solutions:</strong></p>
                <ol>
                    ${guidance.solutions.map(solution => `<li>${solution}</li>`).join('')}
                </ol>
            </div>
        `;

        // Add recent errors for debugging
        if (summary.recentErrors && summary.recentErrors.length > 0) {
            errorHtml += `
                <div class="error-section">
                    <p><strong>🐛 Technical Details (for debugging):</strong></p>
                    <details>
                        <summary>Show recent errors</summary>
                        <pre style="font-size: 11px; overflow-x: auto; background: #f5f5f5; padding: 10px; border-radius: 4px;">${JSON.stringify(summary.recentErrors, null, 2)}</pre>
                    </details>
                </div>
            `;
        }
    } else if (dataInfo.loadError) {
        errorHtml += `
            <div class="error-section">
                <p><strong>Error:</strong> ${dataInfo.loadError}</p>
            </div>
        `;
    }

    errorHtml += `
            <div class="error-section">
                <p><strong>✅ Current Status:</strong></p>
                <p>The app is working with static team data (${dataInfo.totalTeams} teams). 
                Predictions will still work, but the data may not reflect the most recent games.</p>
            </div>

            <div class="error-actions">
                <button id="openConsoleBtn" class="action-btn">Open Browser Console</button>
                <button id="tryRefreshBtn" class="action-btn primary">Try Refreshing Data</button>
            </div>
        </div>
    `;

    panel.innerHTML = errorHtml;
    document.body.appendChild(panel);

    // Add event listeners
    document.getElementById('closeErrorPanel').addEventListener('click', () => {
        panel.remove();
    });

    document.getElementById('openConsoleBtn').addEventListener('click', () => {
        console.log('\n=== DIAGNOSTIC INFORMATION ===');
        console.log('Data Source Info:', dataInfo);
        if (typeof apiClient !== 'undefined') {
            console.log('API Client Error Summary:', apiClient.getErrorSummary());
        }
        console.log('Instructions: Look for errors above marked with ❌ or ⚠️');
        console.log('=== END DIAGNOSTIC INFORMATION ===\n');
        alert('Check the browser console (F12) for detailed diagnostic information');
    });

    document.getElementById('tryRefreshBtn').addEventListener('click', () => {
        panel.remove();
        refreshData();
    });

    // Close on outside click
    panel.addEventListener('click', (e) => {
        if (e.target === panel) {
            panel.remove();
        }
    });
}

// Refresh data from APIs
async function refreshData() {
    const refreshBtn = document.getElementById('refreshDataBtn');
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.textContent = 'Refreshing...';
    }
    
    showLoadingState();
    
    try {
        await refreshTeamsData();
        populateTeamSelectors();
        updateDataSourceIndicator();
        
        // Show success message
        alert('Team data refreshed successfully!');
    } catch (error) {
        console.error('Error refreshing data:', error);
        alert('Failed to refresh data. Using cached data.');
    } finally {
        hideLoadingState();
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.textContent = 'Refresh Data';
        }
    }
}

// Populate team dropdowns with available teams
function populateTeamSelectors() {
    const team1Select = document.getElementById('team1');
    const team2Select = document.getElementById('team2');
    
    // Sort teams alphabetically
    const sortedTeams = Object.keys(teamsData).sort();
    
    sortedTeams.forEach(team => {
        const option1 = document.createElement('option');
        option1.value = team;
        option1.textContent = team;
        team1Select.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = team;
        option2.textContent = team;
        team2Select.appendChild(option2);
    });
}

// Main prediction function
function predictScore() {
    const team1Name = document.getElementById('team1').value;
    const team2Name = document.getElementById('team2').value;
    
    // Validation
    if (!team1Name || !team2Name) {
        alert('Please select both teams');
        return;
    }
    
    if (team1Name === team2Name) {
        alert('Please select two different teams');
        return;
    }
    
    // Get team data
    const team1Data = teamsData[team1Name];
    const team2Data = teamsData[team2Name];
    
    // Calculate predicted scores
    const prediction = calculatePrediction(team1Data, team2Data);
    
    // Display results
    displayResults(team1Name, team2Name, prediction);
}

// Calculate the predicted score based on team statistics
function calculatePrediction(team1, team2) {
    // Calculate team ratings based on multiple factors
    const team1Rating = calculateTeamRating(team1);
    const team2Rating = calculateTeamRating(team2);
    
    // Base scores from offensive strength
    let team1Score = team1.ppg;
    let team2Score = team2.ppg;
    
    // Adjust based on defensive matchup
    // Better offense vs weaker defense = higher score
    const team1DefensiveModifier = (team2.papg - 22) / 22; // 22 is average PAPG
    const team2DefensiveModifier = (team1.papg - 22) / 22;
    
    team1Score += team1Score * team1DefensiveModifier * 0.3;
    team2Score += team2Score * team2DefensiveModifier * 0.3;
    
    // Adjust based on overall team strength and current form
    const ratingDiff = team1Rating - team2Rating;
    team1Score += ratingDiff * 0.15;
    team2Score -= ratingDiff * 0.15;
    
    // Streak adjustment (momentum factor)
    const streakImpact1 = calculateStreakImpact(team1.streak);
    const streakImpact2 = calculateStreakImpact(team2.streak);
    
    team1Score += streakImpact1;
    team2Score += streakImpact2;
    
    // Round to nearest integer
    team1Score = Math.max(7, Math.round(team1Score)); // Minimum 7 points
    team2Score = Math.max(7, Math.round(team2Score));
    
    // Calculate win probability
    const totalRating = team1Rating + team2Rating;
    const team1WinProb = (team1Rating / totalRating * 100).toFixed(1);
    const team2WinProb = (team2Rating / totalRating * 100).toFixed(1);
    
    return {
        team1Score,
        team2Score,
        team1WinProb,
        team2WinProb,
        team1Rating,
        team2Rating
    };
}

// Calculate overall team rating
function calculateTeamRating(team) {
    const winPercentage = team.wins / (team.wins + team.losses);
    
    // Weighted rating based on multiple factors
    const offensiveRating = team.ppg / 35 * 100; // 35 is high PPG
    const defensiveRating = (45 - team.papg) / 45 * 100; // Better defense = lower PAPG
    const recordRating = winPercentage * 100;
    const strengthRating = team.strength;
    
    // Weighted average (can be adjusted)
    const rating = (
        offensiveRating * 0.25 +
        defensiveRating * 0.25 +
        recordRating * 0.20 +
        strengthRating * 0.30
    );
    
    return rating;
}

// Calculate impact of current streak
function calculateStreakImpact(streak) {
    if (streak === 0) return 0;
    
    // Positive streak = momentum boost, negative = confidence loss
    const baseImpact = 1.5;
    const maxImpact = 4.5;
    
    return Math.max(-maxImpact, Math.min(maxImpact, streak * baseImpact));
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Display prediction results
function displayResults(team1Name, team2Name, prediction) {
    // Update team names
    document.getElementById('team1Name').textContent = team1Name;
    document.getElementById('team2Name').textContent = team2Name;
    
    // Update scores
    document.getElementById('team1Score').textContent = prediction.team1Score;
    document.getElementById('team2Score').textContent = prediction.team2Score;
    
    // Generate analysis
    const analysis = generateAnalysis(team1Name, team2Name, prediction);
    document.getElementById('analysisContent').innerHTML = analysis;
    
    // Show results section
    document.getElementById('results').classList.remove('hidden');
    
    // Scroll to results
    document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
}

// Generate detailed analysis text
function generateAnalysis(team1Name, team2Name, prediction) {
    const team1Data = teamsData[team1Name];
    const team2Data = teamsData[team2Name];
    
    // Escape team names for safe HTML insertion
    const team1Escaped = escapeHtml(team1Name);
    const team2Escaped = escapeHtml(team2Name);
    
    let winner, winnerProb;
    if (prediction.team1Score > prediction.team2Score) {
        winner = team1Escaped;
        winnerProb = prediction.team1WinProb;
    } else if (prediction.team2Score > prediction.team1Score) {
        winner = team2Escaped;
        winnerProb = prediction.team2WinProb;
    } else {
        winner = "Neither (Tie)";
        winnerProb = "50.0";
    }
    
    const margin = Math.abs(prediction.team1Score - prediction.team2Score);
    
    let html = `
        <div class="stat-row">
            <span class="stat-label">Predicted Winner:</span>
            <span><strong>${winner}</strong> (${winnerProb}% win probability)</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">Margin of Victory:</span>
            <span><strong>${margin}</strong> points</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">${team1Escaped} Record:</span>
            <span>${team1Data.wins}-${team1Data.losses} (${team1Data.ppg.toFixed(1)} PPG, ${team1Data.papg.toFixed(1)} PAPG)</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">${team2Escaped} Record:</span>
            <span>${team2Data.wins}-${team2Data.losses} (${team2Data.ppg.toFixed(1)} PPG, ${team2Data.papg.toFixed(1)} PAPG)</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">${team1Escaped} Current Streak:</span>
            <span>${formatStreak(team1Data.streak)}</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">${team2Escaped} Current Streak:</span>
            <span>${formatStreak(team2Data.streak)}</span>
        </div>
    `;
    
    return html;
}

// Format streak display
function formatStreak(streak) {
    if (streak > 0) {
        return `${streak} game win streak 🔥`;
    } else if (streak < 0) {
        return `${Math.abs(streak)} game losing streak 📉`;
    } else {
        return 'No active streak';
    }
}
