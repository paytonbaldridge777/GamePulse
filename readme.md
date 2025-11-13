# GamePulse - College Football Score Predictor

A web application that predicts college football game scores using advanced analytics and team statistics.

## Features

- **Intuitive Interface**: Easy-to-use web interface for selecting teams
- **Data-Driven Predictions**: Uses multiple statistical factors including:
  - Win-Loss records
  - Points per game (offensive strength)
  - Points allowed per game (defensive strength)
  - Current win/loss streaks
  - Overall team strength ratings
- **Detailed Analysis**: Provides win probability and game analysis
- **30 College Teams**: Includes major college football programs with realistic statistics

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
- JavaScript (vanilla)

## File Structure

```
GamePulse/
├── index.html          # Main HTML page
├── styles.css          # Styling and layout
├── teams-data.js       # Team statistics database
├── predictor.js        # Prediction algorithm
└── readme.md          # Documentation
```

## Teams Included

The application includes 30 major college football programs such as:
- Alabama, Georgia, Ohio State, Michigan
- Texas, Oklahoma, USC, Clemson
- Florida State, Penn State, Oregon, LSU
- And many more...

## Future Enhancements

Potential improvements could include:
- Historical head-to-head records
- Home field advantage
- Weather conditions
- Injury reports
- Conference strength factors
- Real-time data integration
