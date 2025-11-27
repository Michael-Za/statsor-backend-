interface TrainingSession {
  id: string;
  name: string;
  exercises: Exercise[];
  totalDuration: number;
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string;
  sport: 'soccer' | 'futsal';
  notes?: string;
}

interface Exercise {
  id: string;
  name: string;
  type: 'tactico' | 'tecnico' | 'fisico' | 'cognitivo';
  category: 'ataque' | 'defensa' | 'transiciones' | 'abp' | 'especiales';
  duration: number;
  players: number;
  objective: string;
  image?: string;
}

interface ShareOptions {
  format: 'link' | 'email' | 'whatsapp';
  recipients?: string[];
  message?: string;
}

class TrainingService {
  private readonly STORAGE_KEY = 'training_sessions';
  private readonly HISTORY_KEY = 'training_history';

  async saveSession(session: Omit<TrainingSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<TrainingSession> {
    try {
      const newSession: TrainingSession = {
        ...session,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Get existing sessions
      const existingSessions = this.getSessionHistory();
      const updatedSessions = [newSession, ...existingSessions];

      // Keep only last 50 sessions
      if (updatedSessions.length > 50) {
        updatedSessions.splice(50);
      }

      // Save to localStorage
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(updatedSessions));

      return newSession;
    } catch (error) {
      console.error('Failed to save training session:', error);
      throw new Error('Failed to save training session');
    }
  }

  getSessionHistory(userId?: string): TrainingSession[] {
    try {
      const sessions = localStorage.getItem(this.HISTORY_KEY);
      if (!sessions) return [];

      const parsedSessions = JSON.parse(sessions);
      return parsedSessions.map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt)
      }));
    } catch (error) {
      console.error('Failed to load session history:', error);
      return [];
    }
  }

  async shareSession(sessionId: string, shareOptions: ShareOptions): Promise<string> {
    try {
      const sessions = this.getSessionHistory();
      const session = sessions.find(s => s.id === sessionId);
      
      if (!session) {
        throw new Error('Session not found');
      }

      const shareData = {
        session,
        sharedAt: new Date().toISOString(),
        format: shareOptions.format
      };

      switch (shareOptions.format) {
        case 'link':
          // Generate shareable link
          const shareUrl = this.generateShareableLink(session);
          await navigator.clipboard.writeText(shareUrl);
          return shareUrl;

        case 'email':
          const emailBody = this.generateEmailContent(session);
          const emailUrl = `mailto:${shareOptions.recipients?.join(',')}?subject=Training Session: ${session.name}&body=${encodeURIComponent(emailBody)}`;
          window.open(emailUrl);
          return emailUrl;

        case 'whatsapp':
          const whatsappMessage = this.generateWhatsAppContent(session);
          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;
          window.open(whatsappUrl);
          return whatsappUrl;

        default:
          throw new Error('Unsupported share format');
      }
    } catch (error) {
      console.error('Failed to share session:', error);
      throw new Error('Failed to share session');
    }
  }

  async exportToPDF(session: TrainingSession): Promise<void> {
    try {
      // Create HTML content for PDF
      const htmlContent = this.generatePDFContent(session);
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Popup blocked - please allow popups for PDF export');
      }
      
      // Create document structure safely without document.write
      const doc = printWindow.document;
      doc.open();
      
      // Create HTML structure
      const html = doc.createElement('html');
      const head = doc.createElement('head');
      const body = doc.createElement('body');
      
      // Set title
      const title = doc.createElement('title');
      title.textContent = `Training Session: ${session.name}`;
      head.appendChild(title);
      
      // Create and append styles
      const style = doc.createElement('style');
      style.textContent = `
        body { 
          font-family: Arial, sans-serif; 
          margin: 20px; 
          line-height: 1.6;
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
          border-bottom: 2px solid #4ADE80;
          padding-bottom: 20px;
        }
        .session-info { 
          background: #f8f9fa; 
          padding: 15px; 
          border-radius: 8px; 
          margin-bottom: 20px; 
        }
        .exercise { 
          border: 1px solid #ddd; 
          margin: 10px 0; 
          padding: 15px; 
          border-radius: 8px;
          page-break-inside: avoid;
        }
        .exercise-header { 
          font-weight: bold; 
          color: #4ADE80; 
          margin-bottom: 10px;
          font-size: 18px;
        }
        .exercise-details { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 10px; 
          margin: 10px 0;
        }
        .badge { 
          display: inline-block; 
          padding: 4px 8px; 
          border-radius: 4px; 
          font-size: 12px; 
          font-weight: bold;
          margin-right: 5px;
        }
        .badge-tactico { background: #dbeafe; color: #1e40af; }
        .badge-tecnico { background: #dcfce7; color: #166534; }
        .badge-fisico { background: #fee2e2; color: #991b1b; }
        .badge-cognitivo { background: #f3e8ff; color: #7c3aed; }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      `;
      head.appendChild(style);
      
      // Set body content safely
      body.innerHTML = htmlContent;
      
      // Assemble document
      html.appendChild(head);
      html.appendChild(body);
      doc.appendChild(html);
      
      doc.close();
      
      // Wait for content to load then print
      printWindow.addEventListener('load', () => {
        setTimeout(() => {
          printWindow.print();
          // Don't close automatically to allow user to save PDF
        }, 1000);
      });
      
    } catch (error) {
      console.error('PDF export failed:', error);
      throw new Error('PDF export failed');
    }
  }

  private generatePDFContent(session: TrainingSession): string {
    const totalPlayers = Math.max(...session.exercises.map(e => e.players), 0);
    
    return `
      <div class="header">
        <h1>Training Session: ${session.name}</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
      </div>
      
      <div class="session-info">
        <h3>Session Overview</h3>
        <div class="exercise-details">
          <div><strong>Total Duration:</strong> ${session.totalDuration} minutes</div>
          <div><strong>Number of Exercises:</strong> ${session.exercises.length}</div>
          <div><strong>Sport:</strong> ${session.sport}</div>
          <div><strong>Max Players Needed:</strong> ${totalPlayers}</div>
        </div>
        ${session.notes ? `<div><strong>Notes:</strong> ${session.notes}</div>` : ''}
      </div>

      <h3>Exercises</h3>
      ${session.exercises.map((exercise, index) => `
        <div class="exercise">
          <div class="exercise-header">
            ${index + 1}. ${exercise.name}
            <span class="badge badge-${exercise.type}">${exercise.type}</span>
          </div>
          <div class="exercise-details">
            <div><strong>Duration:</strong> ${exercise.duration} minutes</div>
            <div><strong>Players:</strong> ${exercise.players}</div>
            <div><strong>Category:</strong> ${exercise.category}</div>
            <div><strong>Type:</strong> ${exercise.type}</div>
          </div>
          <div><strong>Objective:</strong> ${exercise.objective}</div>
        </div>
      `).join('')}
    `;
  }
  
  private generateShareableLink(session: TrainingSession): string {
    // In production, this would generate a real shareable link
    const sessionData = encodeURIComponent(JSON.stringify({
      id: session.id,
      name: session.name,
      exercises: session.exercises.length,
      duration: session.totalDuration
    }));
    
    return `${window.location.origin}/training/shared?data=${sessionData}`;
  }

  private generateEmailContent(session: TrainingSession): string {
    return `Training Session: ${session.name}

Duration: ${session.totalDuration} minutes
Exercises: ${session.exercises.length}
Sport: ${session.sport}

Exercises:
${session.exercises.map((exercise, index) => 
  `${index + 1}. ${exercise.name} (${exercise.duration} min, ${exercise.players} players)
     Objective: ${exercise.objective}`
).join('\n\n')}

Generated by Statsor Training Platform
${window.location.origin}`;
  }

  private generateWhatsAppContent(session: TrainingSession): string {
    return `🏃‍♂️ *Training Session: ${session.name}*

⏱️ Duration: ${session.totalDuration} minutes
📋 Exercises: ${session.exercises.length}
⚽ Sport: ${session.sport}

*Exercises:*
${session.exercises.map((exercise, index) => 
  `${index + 1}. ${exercise.name} (${exercise.duration}min)`
).join('\n')}

Generated by Statsor 📊`;
  }

  private generateId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Get session by ID
  getSessionById(sessionId: string): TrainingSession | null {
    const sessions = this.getSessionHistory();
    return sessions.find(s => s.id === sessionId) || null;
  }

  // Delete session
  deleteSession(sessionId: string): boolean {
    try {
      const sessions = this.getSessionHistory();
      const filteredSessions = sessions.filter(s => s.id !== sessionId);
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(filteredSessions));
      return true;
    } catch (error) {
      console.error('Failed to delete session:', error);
      return false;
    }
  }

  // Update session
  updateSession(sessionId: string, updates: Partial<TrainingSession>): TrainingSession | null {
    try {
      const sessions = this.getSessionHistory();
      const sessionIndex = sessions.findIndex(s => s.id === sessionId);
      
      if (sessionIndex === -1) return null;
      
      sessions[sessionIndex] = {
        ...sessions[sessionIndex],
        ...updates,
        updatedAt: new Date()
      } as TrainingSession;
      
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(sessions));
      return sessions[sessionIndex];
    } catch (error) {
      console.error('Failed to update session:', error);
      return null;
    }
  }
}

export const trainingService = new TrainingService();
export type { TrainingSession, Exercise, ShareOptions };