import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function initDatabaseDirect() {
  const client = await pool.connect();
  
  try {
    console.log('Initializing database directly...');

    // Create extension for UUID generation if it doesn't exist
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'coach', 'player')),
        is_verified BOOLEAN DEFAULT false,
        team_id UUID REFERENCES teams(id),
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create teams table
    await client.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        sport VARCHAR(50) NOT NULL,
        founded DATE,
        location VARCHAR(100),
        website VARCHAR(255),
        contact_email VARCHAR(255),
        owner_id UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create team_memberships table
    await client.query(`
      CREATE TABLE IF NOT EXISTS team_memberships (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'manager', 'coach', 'player', 'assistant')),
        status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'inactive', 'pending')),
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        left_at TIMESTAMP
      )
    `);

    // Create team_invitations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS team_invitations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL CHECK (role IN ('manager', 'coach', 'player', 'assistant')),
        invited_by UUID REFERENCES users(id),
        status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        accepted_at TIMESTAMP
      )
    `);

    // Create players table
    await client.query(`
      CREATE TABLE IF NOT EXISTS players (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255),
        date_of_birth DATE,
        position VARCHAR(20) CHECK (position IN ('goalkeeper', 'defender', 'midfielder', 'forward')),
        jersey_number INTEGER CHECK (jersey_number BETWEEN 1 AND 99),
        height INTEGER, -- in cm
        weight INTEGER, -- in kg
        team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
        phone_number VARCHAR(20),
        address TEXT,
        emergency_contact JSONB,
        user_id UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create matches table
    await client.query(`
      CREATE TABLE IF NOT EXISTS matches (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        home_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
        away_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
        home_score INTEGER,
        away_score INTEGER,
        date TIMESTAMP NOT NULL,
        venue VARCHAR(100),
        competition VARCHAR(50),
        season VARCHAR(9), -- e.g., "2023-2024"
        status VARCHAR(20) NOT NULL CHECK (status IN ('scheduled', 'in_progress', 'finished', 'postponed', 'cancelled')) DEFAULT 'scheduled',
        match_type VARCHAR(20) CHECK (match_type IN ('league', 'cup', 'friendly', 'tournament')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create player_match_stats table
    await client.query(`
      CREATE TABLE IF NOT EXISTS player_match_stats (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        player_id UUID REFERENCES players(id) ON DELETE CASCADE,
        match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
        goals INTEGER DEFAULT 0,
        assists INTEGER DEFAULT 0,
        yellow_cards INTEGER DEFAULT 0 CHECK (yellow_cards BETWEEN 0 AND 2),
        red_cards INTEGER DEFAULT 0 CHECK (red_cards BETWEEN 0 AND 1),
        minutes_played INTEGER DEFAULT 0 CHECK (minutes_played BETWEEN 0 AND 120),
        rating NUMERIC(3,1) CHECK (rating BETWEEN 0 AND 10),
        passes INTEGER DEFAULT 0,
        passes_completed INTEGER DEFAULT 0,
        shots INTEGER DEFAULT 0,
        shots_on_target INTEGER DEFAULT 0,
        tackles INTEGER DEFAULT 0,
        saves INTEGER DEFAULT 0,
        position VARCHAR(20) CHECK (position IN ('goalkeeper', 'defender', 'midfielder', 'forward')),
        formation VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create events table
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(100) NOT NULL,
        description TEXT,
        event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('match', 'training', 'meeting', 'other')),
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        location VARCHAR(200),
        team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
        is_all_day BOOLEAN DEFAULT false,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create event_attendees table
    await client.query(`
      CREATE TABLE IF NOT EXISTS event_attendees (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        event_id UUID REFERENCES events(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL CHECK (status IN ('invited', 'accepted', 'declined', 'maybe')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create event_reminders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS event_reminders (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        event_id UUID REFERENCES events(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'notification')),
        minutes_before INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create chat_messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        content TEXT NOT NULL,
        team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        parent_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error')),
        priority VARCHAR(10) NOT NULL CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        is_read BOOLEAN DEFAULT false,
        is_archived BOOLEAN DEFAULT false,
        link VARCHAR(255),
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create ai_chat_history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_chat_history (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        response TEXT NOT NULL,
        context JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create analytics_reports table
    await client.query(`
      CREATE TABLE IF NOT EXISTS analytics_reports (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        filters JSONB,
        metrics JSONB,
        group_by VARCHAR(20),
        chart_type VARCHAR(20) CHECK (chart_type IN ('bar', 'line', 'pie', 'scatter', 'table')),
        data JSONB,
        created_by UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the initialization if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initDatabaseDirect();
}

export default initDatabaseDirect;