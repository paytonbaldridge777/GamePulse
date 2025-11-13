# API Integration Guide

## Overview
This document describes the sports API integration implemented in GamePulse for fetching real-time college football data.

## Integrated APIs

### 1. CollegeFootballData API
**Website**: https://collegefootballdata.com/  
**Documentation**: https://api.collegefootballdata.com/api/docs/  
**Base URL**: `https://api.collegefootballdata.com`

#### Authentication
- API key required for access
- Authentication via Bearer token in Authorization header
- Rate limits apply (check API documentation for current limits)

#### Endpoints Used
| Endpoint | Purpose | Parameters |
|----------|---------|------------|
| `/teams/fbs` | Get list of FBS teams | `year` |
| `/stats/season` | Get season statistics | `year`, `seasonType` |
| `/records` | Get team records | `year` |
| `/games` | Get game results | `year`, `seasonType`, `division` |

#### Sample Request
```javascript
fetch('https://api.collegefootballdata.com/teams/fbs?year=2024', {
    method: 'GET',
    headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer YOUR_API_KEY'
    }
})
```

### 2. TheSportsDB API
**Website**: https://www.thesportsdb.com/  
**Documentation**: https://www.thesportsdb.com/api.php  
**Base URL**: `https://www.thesportsdb.com/api/v1/json`

#### Authentication
- Free tier available (API key: 123)
- Paid tiers offer more features and higher limits
- Patreon supporters get enhanced API keys

#### Endpoints Used
| Endpoint | Purpose | Parameters |
|----------|---------|------------|
| `/search_all_teams.php` | Search teams by league | `l` (league name) |

#### Sample Request
```javascript
fetch('https://www.thesportsdb.com/api/v1/json/123/search_all_teams.php?l=NCAA', {
    method: 'GET',
    headers: {
        'Accept': 'application/json'
    }
})
```

## Implementation Details

### Caching Strategy
- All API responses are cached for 1 hour (3600000 ms)
- Cache is stored in-memory using JavaScript objects
- Cache can be manually cleared using the "Refresh Data" button
- Cache keys include endpoint and parameters to ensure uniqueness

### Error Handling
- Network errors are caught and logged to console
- Failed requests trigger fallback to static data
- User is informed via visual indicator about data source

### Fallback Mechanism
1. Try CollegeFootballData API first
2. If unavailable, try TheSportsDB API
3. If both fail, use static fallback data
4. Visual indicator shows current data source

### Data Processing
The API client processes raw API data into a standardized format:

```javascript
{
    wins: Number,          // Total wins
    losses: Number,        // Total losses
    ppg: Number,          // Points per game (offensive)
    papg: Number,         // Points allowed per game (defensive)
    streak: Number,       // Current streak (positive=wins, negative=losses)
    strength: Number      // Overall team strength rating (70-100)
}
```

## CORS Considerations

### Browser Environment
Since GamePulse runs entirely in the browser, CORS (Cross-Origin Resource Sharing) policies apply:

- ✅ **CollegeFootballData API**: Supports CORS for browser requests
- ✅ **TheSportsDB API**: Supports CORS for browser requests

### Testing Locally
When testing locally:
1. Use a local web server (e.g., `python -m http.server`)
2. Don't open HTML files directly in browser (file:// protocol)
3. Some ad blockers may block API requests

## Rate Limiting

### Best Practices
1. **Use Caching**: Don't fetch data more than once per hour
2. **Batch Requests**: Use Promise.all() to fetch multiple endpoints simultaneously
3. **Error Handling**: Don't retry failed requests immediately
4. **User Control**: Let users manually refresh when needed

### Current Implementation
- 1-hour cache reduces API calls significantly
- Parallel requests for different endpoints
- No automatic retry on failure
- Manual refresh button for user control

## Future API Additions

### Potential APIs to Integrate
1. **API-Football**: Requires paid subscription, offers extensive data
2. **ESPN API**: Unofficial, may require scraping
3. **SportsRadar**: Professional grade, requires enterprise license
4. **Odds API**: For betting lines and odds data
5. **Weather APIs**: For game day weather conditions

### Integration Steps
1. Add API configuration to `API_CONFIG` in `api-client.js`
2. Implement fetch method for the new API
3. Add data mapping to standardized format
4. Update fallback chain in `buildTeamData()`
5. Test and verify data quality

## Troubleshooting

### Common Issues

#### APIs Not Loading
**Symptom**: Yellow indicator shows "Using static fallback data"  
**Possible Causes**:
- Ad blocker blocking API requests
- Network connectivity issues
- API rate limit exceeded
- CORS issues (check browser console)

**Solutions**:
1. Check browser console for error messages
2. Temporarily disable ad blockers
3. Wait and try refreshing later
4. Check API status pages

#### Incorrect Data
**Symptom**: Predictions seem off or data looks outdated  
**Possible Causes**:
- Cache is stale
- API returned partial data
- Team names don't match exactly

**Solutions**:
1. Click "Refresh Data" button
2. Check browser console for API errors
3. Verify team names in API response

#### Performance Issues
**Symptom**: Page loads slowly  
**Possible Causes**:
- Multiple API calls on every page load
- Large API responses
- No caching

**Solutions**:
1. Check cache is working (verify in console)
2. Increase cache timeout if needed
3. Optimize API requests

## API Response Examples

### CollegeFootballData - Teams
```json
[
  {
    "id": 333,
    "school": "Alabama",
    "mascot": "Crimson Tide",
    "abbreviation": "ALA",
    "conference": "SEC",
    "division": "fbs"
  }
]
```

### CollegeFootballData - Stats
```json
[
  {
    "team": "Alabama",
    "statName": "pointsPerGame",
    "statValue": "35.2"
  }
]
```

### TheSportsDB - Teams
```json
{
  "teams": [
    {
      "idTeam": "134920",
      "strTeam": "Alabama Crimson Tide",
      "strSport": "American Football",
      "strLeague": "NCAA"
    }
  ]
}
```

## Security Considerations

### API Keys
- Free tier keys are exposed in client-side code (acceptable for free tiers)
- Never expose paid/private API keys in client-side code
- Use environment variables for sensitive keys
- Consider backend proxy for authenticated APIs

### Data Validation
- All API responses are validated before use
- Malformed data triggers fallback mechanism
- User input is sanitized in predictor.js

### Privacy
- No user data is sent to APIs
- No tracking or analytics from API providers
- All requests are read-only (GET requests only)

## Monitoring and Maintenance

### What to Monitor
1. API availability and uptime
2. Response times
3. Data quality and accuracy
4. Cache hit rates
5. Error rates in browser console

### Maintenance Tasks
1. Update API endpoints if changed
2. Adjust cache timeout based on data freshness needs
3. Add new teams as they join FBS
4. Update static fallback data periodically
5. Monitor API deprecation notices

## Support and Resources

### API Documentation
- [CollegeFootballData Docs](https://api.collegefootballdata.com/api/docs/)
- [TheSportsDB API Docs](https://www.thesportsdb.com/api.php)

### Community
- CollegeFootballData GitHub: https://github.com/CFBD
- TheSportsDB Forum: https://www.thesportsdb.com/forum/

### Contact
For issues with GamePulse API integration:
- Check browser console for errors
- Review this documentation
- Open an issue on GitHub
