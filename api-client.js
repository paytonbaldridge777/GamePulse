// API Client for fetching real-time sports data
// Integrates multiple sports APIs for college football data

const API_CONFIG = {
    // CollegeFootballData API - Free, no API key required for basic usage
    CFBD: {
        baseUrl: 'https://api.collegefootballdata.com',
        enabled: true,
        requiresAuth: false
    },
    // TheSportsDB API - Free tier available
    SPORTSDB: {
        baseUrl: 'https://www.thesportsdb.com/api/v1/json',
        apiKey: '3', // Free tier key
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
    }

    // Fetch data from CollegeFootballData API
    async fetchFromCFBD(endpoint, params = {}) {
        try {
            const url = new URL(`${API_CONFIG.CFBD.baseUrl}${endpoint}`);
            Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`CFBD API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('CFBD API fetch error:', error);
            return null;
        }
    }

    // Fetch data from TheSportsDB API
    async fetchFromSportsDB(endpoint) {
        try {
            const url = `${API_CONFIG.SPORTSDB.baseUrl}/${API_CONFIG.SPORTSDB.apiKey}${endpoint}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`SportsDB API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('SportsDB API fetch error:', error);
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
        try {
            console.log('Fetching team data from APIs...');
            
            // Fetch all necessary data
            const [teams, stats, records, games] = await Promise.all([
                this.getTeams(),
                this.getTeamStats(),
                this.getTeamRecords(),
                this.getGames()
            ]);

            if (!teams) {
                console.warn('No team data available from APIs');
                return null;
            }

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
            }

            // Process records by team
            const recordsByTeam = {};
            if (records) {
                records.forEach(record => {
                    recordsByTeam[record.team] = record;
                });
            }

            // Build team data objects
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
            });

            console.log(`Built data for ${Object.keys(teamData).length} teams from APIs`);
            return teamData;

        } catch (error) {
            console.error('Error building team data:', error);
            return null;
        }
    }

    // Clear cache
    clearCache() {
        this.cache = {};
    }
}

// Create global instance
const apiClient = new SportsAPIClient();
