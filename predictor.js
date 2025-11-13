// GamePulse Score Predictor Logic

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    populateTeamSelectors();
    
    document.getElementById('predictBtn').addEventListener('click', predictScore);
});

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
    
    let winner, winnerProb;
    if (prediction.team1Score > prediction.team2Score) {
        winner = team1Name;
        winnerProb = prediction.team1WinProb;
    } else if (prediction.team2Score > prediction.team1Score) {
        winner = team2Name;
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
            <span class="stat-label">${team1Name} Record:</span>
            <span>${team1Data.wins}-${team1Data.losses} (${team1Data.ppg.toFixed(1)} PPG, ${team1Data.papg.toFixed(1)} PAPG)</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">${team2Name} Record:</span>
            <span>${team2Data.wins}-${team2Data.losses} (${team2Data.ppg.toFixed(1)} PPG, ${team2Data.papg.toFixed(1)} PAPG)</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">${team1Name} Current Streak:</span>
            <span>${formatStreak(team1Data.streak)}</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">${team2Name} Current Streak:</span>
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
