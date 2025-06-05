const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './apps/api/.env' });

const prisma = new PrismaClient();

async function setupDatabase() {
  try {
    console.log('🔗 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Read the SQL setup file
    const sqlFile = path.join(__dirname, 'scripts', 'complete-database-setup.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📜 Running database setup SQL...');
    
    // Split SQL into individual statements and execute them
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      .filter(stmt => !stmt.includes('SELECT \'Database setup completed'))
      .filter(stmt => !stmt.includes('SELECT \'Test data inserted'));
    
    console.log(`📊 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        console.log(`${i + 1}/${statements.length}: ${statement.substring(0, 60)}...`);
        await prisma.$executeRawUnsafe(statement + ';');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Skipping (already exists): ${statement.substring(0, 60)}...`);
        } else {
          console.error(`❌ Error executing statement ${i + 1}:`, error.message);
          console.error(`Statement: ${statement}`);
          // Continue with next statement instead of failing completely
        }
      }
    }
    
    console.log('✅ Database setup completed!');
    
    // Test by counting tables
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    console.log('📋 Tables created:', tables.map(t => t.table_name));
    
    await prisma.$disconnect();
    console.log('🎉 Database setup complete!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();