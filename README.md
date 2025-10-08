# KeeperBot
A custom bot for the Heartkeepers Guild, developed by Nepfinea.  
Only to be used by members of the Heartkeepers, its main purpose is to track event logs and check quota.  

KeeperBot is written in JavaScript and uses MongoDB for its database.

## Automation
At the end of every week `Sunday 00:00 UTC+8 Singapore Time`, the weekly quota will be checked and reset. A list of most active members and those who failed quota will be displayed (if any).

## Commands
### `/leaderboard`: `[category] [activity]`
Displays a list of members with the most hosts, cohosts or events attended  
- **category**: Specifies which leaderboard to view (`Weekly`, `All Time`)  
- **activity**: Specifies which activity type in the leaderboard to view (`Hosts`, `Co-Hosts`, `Attendees`)

### `/profile`: `[member (optional)]`  
Displays your member stats (hosts, cohosts and events attended) for Weekly and All Time.  
- **member**: Specifies which member you want to view the stats of

## Coming Soon
- **Levels system**
