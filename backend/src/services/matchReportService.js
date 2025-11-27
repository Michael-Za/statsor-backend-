const emailService = require('./emailService');
const databaseService = require('./database');
const logger = require('../utils/logger');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

class MatchReportService {
  constructor() {
    this.db = databaseService;
  }

  /**
   * Send match report emails to all team members after a match is completed
   * @param {string} matchId - The ID of the completed match
   */
  async sendMatchReportEmails(matchId) {
    try {
      console.log(`📧 Starting match report email process for match ${matchId}`);
      
      // Get match details with teams and scores
      const matchData = await this.getMatchData(matchId);
      if (!matchData) {
        throw new Error('Match not found');
      }

      // Get match statistics and events
      const matchStats = await this.getMatchStatistics(matchId);
      const matchEvents = await this.getMatchEvents(matchId);
      const playerStats = await this.getPlayerMatchStats(matchId);

      // Get team members (coaches and players) for both teams
      const homeTeamMembers = await this.getTeamMembers(matchData.home_team_id);
      const awayTeamMembers = await this.getTeamMembers(matchData.away_team_id);

      // Generate and send reports for home team
      await this.sendTeamReports({
        teamMembers: homeTeamMembers,
        matchData,
        matchStats,
        matchEvents,
        playerStats,
        isHomeTeam: true
      });

      // Generate and send reports for away team
      await this.sendTeamReports({
        teamMembers: awayTeamMembers,
        matchData,
        matchStats,
        matchEvents,
        playerStats,
        isHomeTeam: false
      });

      console.log(`✅ Match report emails sent successfully for match ${matchId}`);
      return { success: true, message: 'Match reports sent successfully' };
    } catch (error) {
      console.error(`❌ Failed to send match report emails for match ${matchId}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get comprehensive match data
   */
  async getMatchData(matchId) {
    const query = `
      SELECT 
        m.*,
        ht.name as home_team_name,
        ht.coach_id as home_coach_id,
        at.name as away_team_name,
        at.coach_id as away_coach_id,
        ht.sport as sport
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE m.id = $1 AND m.status = 'finished'
    `;
    
    const result = await this.db.query(query, [matchId]);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Get match statistics
   */
  async getMatchStatistics(matchId) {
    const query = `
      SELECT 
        COUNT(CASE WHEN type = 'goal' THEN 1 END) as total_goals,
        COUNT(CASE WHEN type = 'yellow_card' THEN 1 END) as total_yellow_cards,
        COUNT(CASE WHEN type = 'red_card' THEN 1 END) as total_red_cards,
        COUNT(CASE WHEN type = 'substitution' THEN 1 END) as total_substitutions,
        COUNT(CASE WHEN type = 'penalty' THEN 1 END) as total_penalties
      FROM match_events 
      WHERE match_id = $1
    `;
    
    const result = await this.db.query(query, [matchId]);
    return result[0] || {};
  }

  /**
   * Get match events chronologically
   */
  async getMatchEvents(matchId) {
    const query = `
      SELECT 
        me.*,
        p.name as player_name,
        p.number as player_number,
        t.name as team_name
      FROM match_events me
      JOIN players p ON me.player_id = p.id
      JOIN teams t ON p.team_id = t.id
      WHERE me.match_id = $1
      ORDER BY me.minute ASC, me.created_at ASC
    `;
    
    return await this.db.query(query, [matchId]);
  }

  /**
   * Get player statistics for the match
   */
  async getPlayerMatchStats(matchId) {
    const query = `
      SELECT 
        pms.*,
        p.name as player_name,
        p.number as player_number,
        p.position,
        t.name as team_name,
        t.id as team_id
      FROM player_match_stats pms
      JOIN players p ON pms.player_id = p.id
      JOIN teams t ON p.team_id = t.id
      WHERE pms.match_id = $1
      ORDER BY t.name, p.number
    `;
    
    return await this.db.query(query, [matchId]);
  }

  /**
   * Get all team members (coach and players) with their email addresses
   */
  async getTeamMembers(teamId) {
    // Get coach
    const coachQuery = `
      SELECT 
        u.id,
        u.email,
        u.name,
        'coach' as role,
        t.name as team_name
      FROM teams t
      JOIN users u ON t.coach_id = u.id
      WHERE t.id = $1 AND u.email IS NOT NULL
    `;
    
    // Get players (assuming players table has user_id or email field)
    const playersQuery = `
      SELECT 
        p.id,
        COALESCE(u.email, p.email) as email,
        COALESCE(u.name, p.name) as name,
        'player' as role,
        t.name as team_name,
        p.number,
        p.position
      FROM players p
      JOIN teams t ON p.team_id = t.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.team_id = $1 
        AND p.is_active = true 
        AND (u.email IS NOT NULL OR p.email IS NOT NULL)
    `;
    
    const [coaches, players] = await Promise.all([
      this.db.query(coachQuery, [teamId]),
      this.db.query(playersQuery, [teamId])
    ]);
    
    return [...coaches, ...players];
  }

  /**
   * Send reports to all team members
   */
  async sendTeamReports({ teamMembers, matchData, matchStats, matchEvents, playerStats, isHomeTeam }) {
    const teamName = isHomeTeam ? matchData.home_team_name : matchData.away_team_name;
    const opponentName = isHomeTeam ? matchData.away_team_name : matchData.home_team_name;
    const teamScore = isHomeTeam ? matchData.home_score : matchData.away_score;
    const opponentScore = isHomeTeam ? matchData.away_score : matchData.home_score;
    
    // Determine match result
    let result = 'Draw';
    if (teamScore > opponentScore) result = 'Win';
    else if (teamScore < opponentScore) result = 'Loss';
    
    // Filter player stats for this team
    const teamPlayerStats = playerStats.filter(stat => 
      stat.team_id === (isHomeTeam ? matchData.home_team_id : matchData.away_team_id)
    );
    
    // Filter events for this team
    const teamEvents = matchEvents.filter(event => {
      const eventTeamStats = playerStats.find(stat => stat.player_id === event.player_id);
      return eventTeamStats && eventTeamStats.team_id === (isHomeTeam ? matchData.home_team_id : matchData.away_team_id);
    });

    // Send emails to all team members
    const emailPromises = teamMembers.map(member => 
      this.sendIndividualReport({
        member,
        matchData,
        matchStats,
        teamEvents,
        teamPlayerStats,
        teamName,
        opponentName,
        teamScore,
        opponentScore,
        result,
        isHomeTeam
      })
    );

    await Promise.allSettled(emailPromises);
  }

  /**
   * Send individual match report email
   */
  async sendIndividualReport({
    member,
    matchData,
    matchStats,
    teamEvents,
    teamPlayerStats,
    teamName,
    opponentName,
    teamScore,
    opponentScore,
    result,
    isHomeTeam
  }) {
    try {
      // Load and compile email template
      const templatePath = path.join(__dirname, '../templates/match-report-email.hbs');
      const templateSource = await fs.readFile(templatePath, 'utf8');
      const template = handlebars.compile(templateSource);

      // Prepare template data
      const templateData = {
        memberName: member.name,
        memberRole: member.role,
        teamName,
        opponentName,
        teamScore,
        opponentScore,
        result,
        resultClass: result.toLowerCase(),
        matchDate: new Date(matchData.date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        matchTime: new Date(matchData.date).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        venue: matchData.venue || 'TBD',
        competition: matchData.competition || 'Friendly',
        isHomeTeam,
        
        // Match statistics
        totalGoals: matchStats.total_goals || 0,
        totalCards: (matchStats.total_yellow_cards || 0) + (matchStats.total_red_cards || 0),
        totalSubstitutions: matchStats.total_substitutions || 0,
        
        // Team events
        events: teamEvents.map(event => ({
          minute: event.minute,
          type: event.type,
          playerName: event.player_name,
          playerNumber: event.player_number,
          description: event.description || '',
          icon: this.getEventIcon(event.type)
        })),
        
        // Player statistics
        playerStats: teamPlayerStats.map(stat => ({
          name: stat.player_name,
          number: stat.player_number,
          position: stat.position,
          minutesPlayed: stat.minutes_played || 0,
          goals: stat.goals || 0,
          assists: stat.assists || 0,
          rating: stat.rating ? parseFloat(stat.rating).toFixed(1) : 'N/A',
          yellowCards: stat.yellow_cards || 0,
          redCards: stat.red_cards || 0
        })),
        
        // Top performers
        topScorer: this.getTopPerformer(teamPlayerStats, 'goals'),
        topAssister: this.getTopPerformer(teamPlayerStats, 'assists'),
        topRated: this.getTopPerformer(teamPlayerStats, 'rating'),
        
        // App links
        appUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
        supportEmail: process.env.EMAIL_FROM || 'support@statsor.com',
        year: new Date().getFullYear()
      };

      // Generate HTML content
      const html = template(templateData);

      // Send email
      const subject = `🏆 Match Report: ${teamName} ${teamScore}-${opponentScore} ${opponentName} (${result})`;
      
      await emailService.sendEmail({
        to: member.email,
        subject,
        html
      });

      console.log(`✅ Match report sent to ${member.name} (${member.email})`);
    } catch (error) {
      console.error(`❌ Failed to send match report to ${member.name}:`, error.message);
    }
  }

  /**
   * Get icon for match event type
   */
  getEventIcon(eventType) {
    const icons = {
      'goal': '⚽',
      'assist': '🎯',
      'yellow_card': '🟨',
      'red_card': '🟥',
      'substitution': '🔄',
      'penalty': '🥅',
      'own_goal': '😅'
    };
    return icons[eventType] || '📝';
  }

  /**
   * Get top performer in a specific stat
   */
  getTopPerformer(playerStats, statField) {
    if (!playerStats || playerStats.length === 0) return null;
    
    const sorted = playerStats
      .filter(p => p[statField] && p[statField] > 0)
      .sort((a, b) => (b[statField] || 0) - (a[statField] || 0));
    
    return sorted.length > 0 ? {
      name: sorted[0].player_name,
      number: sorted[0].player_number,
      value: sorted[0][statField]
    } : null;
  }

  /**
   * Hook into match completion - call this when a match status changes to 'finished'
   */
  async onMatchCompleted(matchId) {
    // Add a small delay to ensure all match data is properly saved
    setTimeout(async () => {
      await this.sendMatchReportEmails(matchId);
    }, 5000); // 5 second delay
  }

  /**
   * Test email service configuration
   * @returns {Promise<Object>} Test result
   */
  async testEmailService() {
    try {
      // Test email service configuration
       const testResult = await this.emailService.testEmail();
      
      return {
        success: true,
        message: 'Email service is configured correctly',
        details: testResult
      };
    } catch (error) {
      console.error('Email service test failed:', error);
      return {
        success: false,
        message: 'Email service test failed',
        error: error.message
      };
    }
  }
}

module.exports = new MatchReportService();