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
  console.log('🚀 Initializing database tables directly...');
  
  try {
    // First, let's check what tables exist
    console.log('🔍 Checking existing tables...');
    const { data: existingTables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.log('Cannot check existing tables, proceeding with creation...');
    } else {
      console.log('Existing tables:', existingTables?.map(t => t.table_name) || []);
    }
    
    // Try to create tables using direct SQL execution
    console.log('\n📦 Creating tables...');
    
    // Create users table
    console.log('👥 Creating users table...');
    const usersSQL = `
      CREATE TABLE IF NOT EXISTS public.users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role VARCHAR(50) DEFAULT 'player',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    const { error: usersError } = await supabase.rpc('exec_sql', { sql: usersSQL });
    if (usersError) {
      console.log('Users table creation result:', usersError.message);
    } else {
      console.log('✅ Users table created successfully');
    }
    
    // Create teams table
    console.log('🏆 Creating teams table...');
    const teamsSQL = `
      CREATE TABLE IF NOT EXISTS public.teams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        sport VARCHAR(100) NOT NULL,
        description TEXT,
        logo_url VARCHAR(500),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    const { error: teamsError } = await supabase.rpc('exec_sql', { sql: teamsSQL });
    if (teamsError) {
      console.log('Teams table creation result:', teamsError.message);
    } else {
      console.log('✅ Teams table created successfully');
    }
    
    // Create players table
    console.log('⚽ Creating players table...');
    const playersSQL = `
      CREATE TABLE IF NOT EXISTS public.players (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    `;
    
    const { error: playersError } = await supabase.rpc('exec_sql', { sql: playersSQL });
    if (playersError) {
      console.log('Players table creation result:', playersError.message);
    } else {
      console.log('✅ Players table created successfully');
    }
    
    // Create matches table
    console.log('🏟️ Creating matches table...');
    const matchesSQL = `
      CREATE TABLE IF NOT EXISTS public.matches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        home_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
        away_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
        match_date TIMESTAMP WITH TIME ZONE NOT NULL,
        venue VARCHAR(255),
        status VARCHAR(50) DEFAULT 'scheduled',
        home_score INTEGER DEFAULT 0,
        away_score INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    const { error: matchesError } = await supabase.rpc('exec_sql', { sql: matchesSQL });
    if (matchesError) {
      console.log('Matches table creation result:', matchesError.message);
    } else {
      console.log('✅ Matches table created successfully');
    }
    
    // Test table access
    console.log('\n🧪 Testing table access...');
    const { data: playersTest, error: playersTestError } = await supabase
      .from('players')
      .select('count')
      .limit(1);
    
    if (playersTestError) {
      console.error('❌ Players table test failed:', playersTestError.message);
    } else {
      console.log('✅ Players table is accessible');
    }
    
    // Insert test data
    console.log('\n🧪 Inserting test data...');
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: 'Test Team',
        sport: 'Football',
        description: 'A test team for development'
      })
      .select()
      .single();
    
    if (teamError && teamError.code !== '23505') {
      console.warn('⚠️ Team insertion warning:', teamError.message);
    } else if (teamData) {
      console.log('✅ Test team created:', teamData.name);
    }
    
    console.log('\n✅ Database initialization completed!');
    console.log('🚀 You can now start the backend server with: node src/server.js');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
    console.error('\n💡 Alternative: Copy the SQL from setup-minimal-tables.sql and run it manually in Supabase SQL Editor');
  }
}

initializeDatabase();