# GamePulse - College Football Score Predictor

A web application that predicts college football game scores using advanced analytics and team statistics.

## Features

- **Intuitive Interface**: Easy-to-use web interface for selecting teams
- **Live Data Integration**: Fetches real-time team statistics from multiple sports APIs:
  - CollegeFootballData API - Primary source for FBS team data
  - TheSportsDB API - Backup source for team information
  - Automatic fallback to static data if APIs are unavailable
- **Data-Driven Predictions**: Uses multiple statistical factors including:
  - Win-Loss records
  - Points per game (offensive strength)
  - Points allowed per game (defensive strength)
  - Current win/loss streaks
  - Overall team strength ratings
- **Detailed Analysis**: Provides win probability and game analysis
- **Data Refresh**: Manual refresh button to get the latest team statistics
- **30+ College Teams**: Includes major college football programs with up-to-date statistics

## How to Use

1. Open `index.html` in a web browser
2. Select two teams from the dropdown menus
3. Click "Predict Score" to see the predicted outcome
4. Review the detailed analysis including:
   - Predicted final score
   - Win probability for each team
   - Margin of victory
   - Team statistics comparison
   - Current form and streaks

## Prediction Algorithm

The prediction model considers:

1. **Offensive Capability**: Team's average points per game
2. **Defensive Strength**: Team's average points allowed per game
3. **Matchup Analysis**: How each team's offense matches against opponent's defense
4. **Win Percentage**: Overall team performance and record
5. **Momentum**: Current winning or losing streak
6. **Team Strength Rating**: Composite rating of team quality

The algorithm calculates a predicted score by:
- Starting with each team's average offensive output
- Adjusting based on defensive matchup
- Factoring in overall team strength differential
- Adding momentum from current streaks
- Ensuring realistic score ranges

## Technologies Used

- HTML5
- CSS3 (with responsive design)
- JavaScript (vanilla ES6+)
- Fetch API for HTTP requests
- Multiple Sports APIs integration

## API Integration

The application integrates with the following sports data APIs:

### CollegeFootballData API
- **Purpose**: Primary source for college football statistics
- **Endpoints Used**:
  - `/teams/fbs` - List of FBS teams
  - `/stats/season` - Season statistics (PPG, PAPG)
  - `/records` - Team win-loss records
  - `/games` - Game results for calculating streaks
- **Authentication**: No API key required for basic usage
- **Rate Limiting**: Cached for 1 hour to minimize requests

### TheSportsDB API
- **Purpose**: Backup data source for team information
- **Endpoints Used**:
  - `/search_all_teams.php?l=NCAA` - NCAA team data
- **Authentication**: Free tier (API key: 3)
- **Rate Limiting**: Cached for 1 hour

### Fallback Mechanism
If APIs are unavailable or blocked, the application automatically falls back to static team data to ensure uninterrupted functionality. A visual indicator shows whether live or static data is being used.

## File Structure

```
GamePulse/
├── index.html          # Main HTML page
├── styles.css          # Styling and layout
├── api-client.js       # API integration and data fetching
├── teams-data.js       # Team statistics (dynamic + static fallback)
├── predictor.js        # Prediction algorithm and UI logic
└── readme.md          # Documentation
```

## Teams Included

The application includes 30 major college football programs such as:
- Alabama, Georgia, Ohio State, Michigan
- Texas, Oklahoma, USC, Clemson
- Florida State, Penn State, Oregon, LSU
- And many more...

## Data Source Indicator

The application displays a visual indicator showing the current data source:
- **✅ Using live API data** (green) - Data fetched from sports APIs
- **📊 Using static fallback data** (yellow) - Using cached/static data

## Future Enhancements

Potential improvements could include:
- Historical head-to-head records
- Home field advantage calculations
- Weather conditions integration
- Injury reports and player availability
- Conference strength factors
- Additional API sources (API-Football, etc.)
- Betting odds integration
- Machine learning model improvements
