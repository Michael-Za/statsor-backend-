require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  console.log('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function initializeDatabase() {
  console.log('🚀 Initializing database tables...');
  
  try {
    // Enable extensions
    console.log('📦 Enabling extensions...');
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        CREATE EXTENSION IF NOT EXISTS "pgcrypto";
      `
    });
    
    // Create users table
    console.log('👥 Creating users table...');
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255),
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          role VARCHAR(50) DEFAULT 'player',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    // Create teams table
    console.log('🏆 Creating teams table...');
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.teams (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(255) NOT NULL,
          sport VARCHAR(100) NOT NULL,
          description TEXT,
          logo_url VARCHAR(500),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    // Create players table
    console.log('⚽ Creating players table...');
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.players (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
          team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
          jersey_number INTEGER,
          position VARCHAR(100),
          height DECIMAL(5,2),
          weight DECIMAL(5,2),
          date_of_birth DATE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    // Create matches table
    console.log('🏟️ Creating matches table...');
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.matches (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          home_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
          away_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
          match_date TIMESTAMP WITH TIME ZONE NOT NULL,
          venue VARCHAR(255),
          status VARCHAR(50) DEFAULT 'scheduled',
          home_score INTEGER DEFAULT 0,
          away_score INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    // Create indexes
    console.log('📊 Creating indexes...');
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
        CREATE INDEX IF NOT EXISTS idx_players_user_id ON public.players(user_id);
        CREATE INDEX IF NOT EXISTS idx_players_team_id ON public.players(team_id);
        CREATE INDEX IF NOT EXISTS idx_matches_date ON public.matches(match_date);
      `
    });
    
    // Insert test data
    console.log('🧪 Inserting test data...');
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: 'Test Team',
        sport: 'Football',
        description: 'A test team for development'
      })
      .select()
      .single();
    
    if (teamError && teamError.code !== '23505') { // Ignore duplicate key error
      console.warn('⚠️ Team insertion warning:', teamError.message);
    } else if (teamData) {
      console.log('✅ Test team created:', teamData.name);
    }
    
    console.log('\n✅ Database initialization completed successfully!');
    console.log('🚀 You can now start the backend server with: node src/server.js');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
    process.exit(1);
  }
}

initializeDatabase();