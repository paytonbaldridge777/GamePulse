// API Client for fetching real-time sports data
// Integrates multiple sports APIs for college football data

const API_CONFIG = {
    // CollegeFootballData API - Requires API key with Bearer authentication
    CFBD: {
        baseUrl: 'https://api.collegefootballdata.com',
        apiKey: '7PlBbXRmXCeYfBcdvwt6FvukW9FuK8CIiqIDNMsVCZYTGJs9NtKbaqW4SXKhH4SF',
        enabled: true,
        requiresAuth: true
    },
    // TheSportsDB API - Free tier available
    SPORTSDB: {
        baseUrl: 'https://www.thesportsdb.com/api/v1/json',
        apiKey: '123', // Free tier key
        enabled: true,
        requiresAuth: false
    },
    // API-Football (for some general stats)
    API_FOOTBALL: {
        baseUrl: 'https://v3.football.api-sports.io',
        enabled: false, // Requires paid API key
        requiresAuth: true
    }
};

class SportsAPIClient {
    constructor() {
        this.cache = {};
        this.cacheTimeout = 3600000; // 1 hour in milliseconds
        this.currentYear = new Date().getFullYear();
        this.errorLog = []; // Track all errors for debugging
        this.lastErrorDetails = null; // Store detailed info about last error
    }

    // Log errors with detailed context
    logError(context, error, additionalInfo = {}) {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            context,
            error: error.message,
            errorType: this.categorizeError(error),
            ...additionalInfo
        };
        
        this.errorLog.push(errorEntry);
        this.lastErrorDetails = errorEntry;
        
        // Keep only last 50 errors
        if (this.errorLog.length > 50) {
            this.errorLog.shift();
        }
        
        console.error(`[API Error - ${context}]`, {
            message: error.message,
            type: errorEntry.errorType,
            ...additionalInfo
        });
        
        return errorEntry;
    }

    // Categorize errors to provide better troubleshooting
    categorizeError(error) {
        const message = error.message.toLowerCase();
        
        if (message.includes('failed to fetch')) {
            return 'NETWORK_ERROR';
        } else if (message.includes('cors')) {
            return 'CORS_ERROR';
        } else if (message.includes('timeout')) {
            return 'TIMEOUT_ERROR';
        } else if (message.includes('404')) {
            return 'NOT_FOUND';
        } else if (message.includes('403') || message.includes('401')) {
            return 'AUTH_ERROR';
        } else if (message.includes('429')) {
            return 'RATE_LIMIT';
        } else if (message.includes('500') || message.includes('502') || message.includes('503')) {
            return 'SERVER_ERROR';
        } else {
            return 'UNKNOWN_ERROR';
        }
    }

    // Get user-friendly error message and solutions
    getErrorGuidance(errorType) {
        const guidance = {
            'NETWORK_ERROR': {
                message: 'Network request blocked or failed',
                reasons: [
                    'Ad blocker or browser extension blocking the request',
                    'Network connectivity issues',
                    'Firewall or security software blocking requests'
                ],
                solutions: [
                    'Disable ad blockers for this site',
                    'Check your internet connection',
                    'Try a different browser',
                    'Check browser console for detailed errors'
                ]
            },
            'CORS_ERROR': {
                message: 'Cross-origin request blocked',
                reasons: [
                    'API does not allow requests from this domain',
                    'Browser security policy blocking the request'
                ],
                solutions: [
                    'API may need to be accessed through a proxy',
                    'Contact the API provider about CORS settings'
                ]
            },
            'TIMEOUT_ERROR': {
                message: 'Request timed out',
                reasons: [
                    'API server is slow to respond',
                    'Network latency is too high'
                ],
                solutions: [
                    'Try again in a few moments',
                    'Check API status page'
                ]
            },
            'RATE_LIMIT': {
                message: 'API rate limit exceeded',
                reasons: [
                    'Too many requests made in a short time'
                ],
                solutions: [
                    'Wait a few minutes before refreshing',
                    'Data is cached for 1 hour to prevent this'
                ]
            },
            'AUTH_ERROR': {
                message: 'Authentication failed',
                reasons: [
                    'API key is invalid or expired',
                    'API requires authentication'
                ],
                solutions: [
                    'Check API configuration',
                    'Verify API key is valid'
                ]
            },
            'SERVER_ERROR': {
                message: 'API server error',
                reasons: [
                    'API server is experiencing issues',
                    'API endpoint may be down'
                ],
                solutions: [
                    'Try again later',
                    'Check API status page',
                    'Using cached or fallback data'
                ]
            },
            'NOT_FOUND': {
                message: 'API endpoint not found',
                reasons: [
                    'API endpoint URL is incorrect',
                    'API version may have changed'
                ],
                solutions: [
                    'Check API documentation',
                    'Verify endpoint URLs are correct'
                ]
            },
            'UNKNOWN_ERROR': {
                message: 'Unknown error occurred',
                reasons: [
                    'Unexpected error type'
                ],
                solutions: [
                    'Check browser console for details',
                    'Try refreshing the page'
                ]
            }
        };
        
        return guidance[errorType] || guidance['UNKNOWN_ERROR'];
    }

    // Fetch data from CollegeFootballData API
    async fetchFromCFBD(endpoint, params = {}) {
        const startTime = Date.now();
        try {
            const url = new URL(`${API_CONFIG.CFBD.baseUrl}${endpoint}`);
            Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
            
            console.log(`[CFBD API] Fetching: ${endpoint}`, params);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${API_CONFIG.CFBD.apiKey}`
                }
            });
            
            if (!response.ok) {
                const error = new Error(`CFBD API error: ${response.status} ${response.statusText}`);
                this.logError('CFBD API Response Error', error, {
                    endpoint,
                    params,
                    status: response.status,
                    statusText: response.statusText,
                    url: url.toString(),
                    duration: Date.now() - startTime
                });
                return null;
            }
            
            const data = await response.json();
            console.log(`[CFBD API] Success: ${endpoint} (${Date.now() - startTime}ms)`, 
                        `Returned ${Array.isArray(data) ? data.length : 'N/A'} items`);
            return data;
        } catch (error) {
            this.logError('CFBD API Fetch Error', error, {
                endpoint,
                params,
                url: `${API_CONFIG.CFBD.baseUrl}${endpoint}`,
                duration: Date.now() - startTime,
                possibleCauses: error.message.includes('Failed to fetch') 
                    ? 'Network blocked, CORS issue, or ad blocker' 
                    : 'Unknown error'
            });
            return null;
        }
    }

    // Fetch data from TheSportsDB API
    async fetchFromSportsDB(endpoint) {
        const startTime = Date.now();
        try {
            const url = `${API_CONFIG.SPORTSDB.baseUrl}/${API_CONFIG.SPORTSDB.apiKey}${endpoint}`;
            
            console.log(`[SportsDB API] Fetching: ${endpoint}`);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                const error = new Error(`SportsDB API error: ${response.status} ${response.statusText}`);
                this.logError('SportsDB API Response Error', error, {
                    endpoint,
                    status: response.status,
                    statusText: response.statusText,
                    url,
                    duration: Date.now() - startTime
                });
                return null;
            }
            
            const data = await response.json();
            console.log(`[SportsDB API] Success: ${endpoint} (${Date.now() - startTime}ms)`);
            return data;
        } catch (error) {
            this.logError('SportsDB API Fetch Error', error, {
                endpoint,
                url: `${API_CONFIG.SPORTSDB.baseUrl}/${API_CONFIG.SPORTSDB.apiKey}${endpoint}`,
                duration: Date.now() - startTime,
                possibleCauses: error.message.includes('Failed to fetch') 
                    ? 'Network blocked, CORS issue, or ad blocker' 
                    : 'Unknown error'
            });
            return null;
        }
    }

    // Get team list from CFBD
    async getTeams() {
        const cacheKey = 'teams_list';
        
        // Check cache first
        if (this.cache[cacheKey] && Date.now() - this.cache[cacheKey].timestamp < this.cacheTimeout) {
            return this.cache[cacheKey].data;
        }

        try {
            // Try CFBD first
            if (API_CONFIG.CFBD.enabled) {
                const teams = await this.fetchFromCFBD('/teams/fbs', { year: this.currentYear });
                if (teams && teams.length > 0) {
                    this.cache[cacheKey] = { data: teams, timestamp: Date.now() };
                    return teams;
                }
            }

            // Fallback to SportsDB
            if (API_CONFIG.SPORTSDB.enabled) {
                const result = await this.fetchFromSportsDB('/search_all_teams.php?l=NCAA');
                if (result && result.teams) {
                    const teams = result.teams.filter(team => team.strSport === 'American Football');
                    this.cache[cacheKey] = { data: teams, timestamp: Date.now() };
                    return teams;
                }
            }

            return null;
        } catch (error) {
            console.error('Error fetching teams:', error);
            return null;
        }
    }

    // Get team statistics from CFBD
    async getTeamStats(year = null) {
        year = year || this.currentYear;
        const cacheKey = `team_stats_${year}`;
        
        // Check cache
        if (this.cache[cacheKey] && Date.now() - this.cache[cacheKey].timestamp < this.cacheTimeout) {
            return this.cache[cacheKey].data;
        }

        try {
            if (API_CONFIG.CFBD.enabled) {
                const stats = await this.fetchFromCFBD('/stats/season', { 
                    year: year,
                    seasonType: 'regular'
                });
                
                if (stats) {
                    this.cache[cacheKey] = { data: stats, timestamp: Date.now() };
                    return stats;
                }
            }
            
            return null;
        } catch (error) {
            console.error('Error fetching team stats:', error);
            return null;
        }
    }

    // Get team records/standings
    async getTeamRecords(year = null) {
        year = year || this.currentYear;
        const cacheKey = `team_records_${year}`;
        
        // Check cache
        if (this.cache[cacheKey] && Date.now() - this.cache[cacheKey].timestamp < this.cacheTimeout) {
            return this.cache[cacheKey].data;
        }

        try {
            if (API_CONFIG.CFBD.enabled) {
                const records = await this.fetchFromCFBD('/records', { 
                    year: year
                });
                
                if (records) {
                    this.cache[cacheKey] = { data: records, timestamp: Date.now() };
                    return records;
                }
            }
            
            return null;
        } catch (error) {
            console.error('Error fetching team records:', error);
            return null;
        }
    }

    // Get game data for calculating recent form/streaks
    async getGames(year = null, seasonType = 'regular') {
        year = year || this.currentYear;
        const cacheKey = `games_${year}_${seasonType}`;
        
        // Check cache
        if (this.cache[cacheKey] && Date.now() - this.cache[cacheKey].timestamp < this.cacheTimeout) {
            return this.cache[cacheKey].data;
        }

        try {
            if (API_CONFIG.CFBD.enabled) {
                const games = await this.fetchFromCFBD('/games', { 
                    year: year,
                    seasonType: seasonType,
                    division: 'fbs'
                });
                
                if (games) {
                    this.cache[cacheKey] = { data: games, timestamp: Date.now() };
                    return games;
                }
            }
            
            return null;
        } catch (error) {
            console.error('Error fetching games:', error);
            return null;
        }
    }

    // Calculate team streak from games
    calculateStreak(teamName, games) {
        if (!games || !games.length) return 0;

        // Filter games for this team, sorted by date (most recent first)
        const teamGames = games
            .filter(game => 
                game.home_team === teamName || game.away_team === teamName
            )
            .sort((a, b) => new Date(b.start_date) - new Date(a.start_date));

        let streak = 0;
        let lastResult = null;

        for (const game of teamGames) {
            if (!game.home_points || !game.away_points) continue;

            const isHome = game.home_team === teamName;
            const teamPoints = isHome ? game.home_points : game.away_points;
            const opponentPoints = isHome ? game.away_points : game.home_points;
            const won = teamPoints > opponentPoints;

            if (lastResult === null) {
                lastResult = won;
                streak = won ? 1 : -1;
            } else if (lastResult === won) {
                streak = won ? streak + 1 : streak - 1;
            } else {
                break;
            }
        }

        return streak;
    }

    // Build comprehensive team data from multiple API sources
    async buildTeamData() {
        console.log('=== Starting Team Data Build Process ===');
        const buildStartTime = Date.now();
        
        try {
            console.log('[Step 1/4] Fetching team data from APIs...');
            
            // Fetch all necessary data
            const [teams, stats, records, games] = await Promise.all([
                this.getTeams(),
                this.getTeamStats(),
                this.getTeamRecords(),
                this.getGames()
            ]);

            // Log what we got back
            console.log('[Step 2/4] API Response Summary:', {
                teams: teams ? `✓ ${Array.isArray(teams) ? teams.length : 'N/A'} teams` : '✗ Failed',
                stats: stats ? `✓ ${Array.isArray(stats) ? stats.length : 'N/A'} stats` : '✗ Failed',
                records: records ? `✓ ${Array.isArray(records) ? records.length : 'N/A'} records` : '✗ Failed',
                games: games ? `✓ ${Array.isArray(games) ? games.length : 'N/A'} games` : '✗ Failed'
            });

            if (!teams) {
                console.warn('❌ [Step 3/4] No team data available from APIs');
                console.warn('⚠️ FALLBACK TRIGGER: No teams data received from any API');
                console.warn('💡 Troubleshooting Tips:');
                if (this.lastErrorDetails) {
                    const guidance = this.getErrorGuidance(this.lastErrorDetails.errorType);
                    console.warn('   Error Type:', this.lastErrorDetails.errorType);
                    console.warn('   Message:', guidance.message);
                    console.warn('   Possible Reasons:', guidance.reasons);
                    console.warn('   Suggested Solutions:', guidance.solutions);
                }
                return null;
            }

            console.log('[Step 3/4] Processing team data...');
            const teamData = {};

            // Process stats by team
            const statsByTeam = {};
            if (stats) {
                stats.forEach(stat => {
                    if (!statsByTeam[stat.team]) {
                        statsByTeam[stat.team] = [];
                    }
                    statsByTeam[stat.team].push(stat);
                });
                console.log(`   - Processed stats for ${Object.keys(statsByTeam).length} teams`);
            } else {
                console.warn('   - ⚠️ No stats data available, using defaults');
            }

            // Process records by team
            const recordsByTeam = {};
            if (records) {
                records.forEach(record => {
                    recordsByTeam[record.team] = record;
                });
                console.log(`   - Processed records for ${Object.keys(recordsByTeam).length} teams`);
            } else {
                console.warn('   - ⚠️ No records data available, using defaults');
            }

            // Build team data objects
            let teamsProcessed = 0;
            teams.forEach(team => {
                const teamName = team.school || team.strTeam;
                if (!teamName) return;

                const teamStats = statsByTeam[teamName] || [];
                const teamRecord = recordsByTeam[teamName];

                // Calculate PPG (points per game) from stats
                let ppg = 30.0; // default
                let papg = 22.0; // default (points allowed per game)
                
                // Look for offensive and defensive stats
                const offensiveStats = teamStats.find(s => s.statName === 'pointsPerGame');
                const defensiveStats = teamStats.find(s => s.statName === 'pointsAllowedPerGame');
                
                if (offensiveStats) ppg = parseFloat(offensiveStats.statValue) || ppg;
                if (defensiveStats) papg = parseFloat(defensiveStats.statValue) || papg;

                // Get record
                let wins = 8, losses = 4;
                if (teamRecord) {
                    wins = teamRecord.total?.wins || wins;
                    losses = teamRecord.total?.losses || losses;
                }

                // Calculate streak
                const streak = games ? this.calculateStreak(teamName, games) : 0;

                // Calculate strength rating (0-100)
                const winPercentage = wins / (wins + losses);
                const strength = Math.round(
                    (winPercentage * 40) + 
                    ((ppg / 40) * 30) + 
                    ((1 - (papg / 35)) * 30)
                );

                teamData[teamName] = {
                    wins,
                    losses,
                    ppg: parseFloat(ppg.toFixed(1)),
                    papg: parseFloat(papg.toFixed(1)),
                    streak,
                    strength: Math.max(70, Math.min(100, strength))
                };
                teamsProcessed++;
            });

            const buildDuration = Date.now() - buildStartTime;
            console.log(`[Step 4/4] ✅ Successfully built data for ${teamsProcessed} teams from APIs (${buildDuration}ms)`);
            console.log('=== Team Data Build Complete ===');
            return teamData;

        } catch (error) {
            console.error('❌ Error building team data:', error);
            this.logError('Build Team Data', error, {
                duration: Date.now() - buildStartTime
            });
            
            console.error('⚠️ FALLBACK TRIGGER: Exception during team data build');
            console.error('💡 Check the errors above for details');
            return null;
        }
    }

    // Clear cache
    clearCache() {
        this.cache = {};
    }

    // Get error summary for troubleshooting
    getErrorSummary() {
        if (this.errorLog.length === 0) {
            return {
                hasErrors: false,
                message: 'No errors recorded'
            };
        }

        const errorTypes = {};
        this.errorLog.forEach(err => {
            errorTypes[err.errorType] = (errorTypes[err.errorType] || 0) + 1;
        });

        const mostCommonType = Object.keys(errorTypes).reduce((a, b) => 
            errorTypes[a] > errorTypes[b] ? a : b
        );

        const guidance = this.getErrorGuidance(mostCommonType);

        return {
            hasErrors: true,
            totalErrors: this.errorLog.length,
            errorTypes,
            mostCommonError: mostCommonType,
            lastError: this.lastErrorDetails,
            guidance,
            recentErrors: this.errorLog.slice(-5) // Last 5 errors
        };
    }

    // Clear error log
    clearErrorLog() {
        this.errorLog = [];
        this.lastErrorDetails = null;
    }
}

// Create global instance
const apiClient = new SportsAPIClient();
