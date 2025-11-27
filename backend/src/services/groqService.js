const OpenAI = require('openai');

class GroqService {
  constructor() {
    // Initialize Groq client using OpenAI SDK
    this.apiKey = process.env.GROQ_API_KEY || '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';
    
    if (!this.apiKey) {
      console.warn('GROQ_API_KEY not found in environment variables');
    }

    this.client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: 'https://api.groq.com/openai/v1'
    });

    // Use a fast Groq model
    this.model = 'llama-3.3-70b-versatile'; // Fast and capable model
  }

  async generateChatResponse(message, context = {}) {
    try {
      const systemMessage = this.buildSystemMessage(context);
      
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: systemMessage
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        stream: false
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Groq API error:', error);
      throw new Error(`Failed to generate response: ${error.message}`);
    }
  }

  async analyzeTeam(teamData) {
    try {
      const prompt = `Analyze the following football team data and provide insights:
      
Team: ${teamData.name || 'Unknown Team'}
Formation: ${teamData.formation || 'Not specified'}
Recent Results: ${teamData.recentResults || 'No data'}
Players: ${teamData.playerCount || 0}

Provide a detailed analysis covering:
1. Team strengths and weaknesses
2. Formation effectiveness
3. Key players and their impact
4. Recommendations for improvement`;

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert football analyst and tactical advisor. Provide detailed, actionable insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      return {
        analysis: completion.choices[0].message.content,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Team analysis error:', error);
      throw new Error(`Failed to analyze team: ${error.message}`);
    }
  }

  async predictMatch(matchData) {
    try {
      const prompt = `Predict the outcome of this football match:
      
Home Team: ${matchData.homeTeam || 'Unknown'}
Away Team: ${matchData.awayTeam || 'Unknown'}
Competition: ${matchData.competition || 'Unknown'}
Home Team Form: ${matchData.homeForm || 'Unknown'}
Away Team Form: ${matchData.awayForm || 'Unknown'}

Provide:
1. Win/Draw/Loss probabilities
2. Expected score
3. Key factors affecting the outcome
4. Tactical recommendations`;

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert football analyst specializing in match predictions and tactical analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1200
      });

      return {
        prediction: completion.choices[0].message.content,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Match prediction error:', error);
      throw new Error(`Failed to predict match: ${error.message}`);
    }
  }

  async generateTrainingPlan(teamData, goals) {
    try {
      const prompt = `Create a training plan for a football team:
      
Team Level: ${teamData.level || 'Unknown'}
Focus Areas: ${goals || 'General improvement'}
Available Time: ${teamData.trainingTime || 'Not specified'}
Team Size: ${teamData.playerCount || 'Unknown'}

Provide a detailed training plan including:
1. Weekly schedule
2. Specific drills and exercises
3. Focus areas for improvement
4. Performance metrics to track`;

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert football coach specializing in training program development.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      return {
        trainingPlan: completion.choices[0].message.content,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Training plan error:', error);
      throw new Error(`Failed to generate training plan: ${error.message}`);
    }
  }

  buildSystemMessage(context) {
    let systemMessage = `You are an AI Football Assistant for a football management platform. You help coaches, managers, and players with:
- Tactical analysis and advice
- Player performance insights
- Match predictions and strategy
- Training recommendations
- Team management guidance

Provide clear, actionable advice using football terminology. Be concise but thorough.`;

    if (context.userRole) {
      systemMessage += `\n\nUser Role: ${context.userRole}`;
    }

    if (context.teamName) {
      systemMessage += `\nTeam: ${context.teamName}`;
    }

    return systemMessage;
  }

  async checkStatus() {
    try {
      // Simple test to check if API is working
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: 'Hello'
          }
        ],
        max_tokens: 10
      });

      return {
        status: 'online',
        model: this.model,
        working: !!completion.choices[0].message.content
      };
    } catch (error) {
      console.error('Status check error:', error);
      throw new Error('AI service is offline');
    }
  }
}

module.exports = GroqService;
