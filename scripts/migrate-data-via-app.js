#!/usr/bin/env node

/**
 * Data Migration Script via Application
 * This script connects to both databases and migrates data through the application layer
 */

const { PrismaClient } = require('@prisma/client');

// Database connections
const oldDb = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://vssyl_user:ArthurGeorge116!@172.30.0.4:5432/vssyl_production?connection_limit=5&pool_timeout=20'
    }
  }
});

const newDb = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://vssyl_user:ArthurGeorge116!@172.30.0.15:5432/vssyl_production?connection_limit=5&pool_timeout=20'
    }
  }
});

async function migrateData() {
  console.log('🔄 Starting data migration from old database to new optimized database...');
  
  try {
    // Test connections
    console.log('🔍 Testing database connections...');
    await oldDb.$connect();
    console.log('✅ Connected to old database');
    
    await newDb.$connect();
    console.log('✅ Connected to new database');
    
    // Get all tables
    const tables = await oldDb.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    console.log(`📊 Found ${tables.length} tables to migrate`);
    
    // Migrate each table
    for (const table of tables) {
      const tableName = table.table_name;
      console.log(`📤 Migrating table: ${tableName}`);
      
      try {
        // Get data from old database
        const data = await oldDb.$queryRawUnsafe(`SELECT * FROM "${tableName}"`);
        
        if (data.length === 0) {
          console.log(`  ⚠️  Table ${tableName} is empty, skipping...`);
          continue;
        }
        
        // Clear existing data in new database
        await newDb.$executeRawUnsafe(`DELETE FROM "${tableName}"`);
        
        // Insert data in batches
        const batchSize = 100;
        for (let i = 0; i < data.length; i += batchSize) {
          const batch = data.slice(i, i + batchSize);
          
          if (batch.length > 0) {
            // Get column names
            const columns = Object.keys(batch[0]);
            const values = batch.map(row => 
              `(${columns.map(col => {
                const value = row[col];
                if (value === null) return 'NULL';
                if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
                if (typeof value === 'boolean') return value;
                if (value instanceof Date) return `'${value.toISOString()}'`;
                return value;
              }).join(', ')})`
            ).join(', ');
            
            const insertQuery = `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES ${values}`;
            await newDb.$executeRawUnsafe(insertQuery);
          }
        }
        
        console.log(`  ✅ Migrated ${data.length} rows to ${tableName}`);
        
      } catch (error) {
        console.error(`  ❌ Error migrating table ${tableName}:`, error.message);
        // Continue with other tables
      }
    }
    
    console.log('🎉 Data migration completed successfully!');
    
    // Verify migration
    console.log('🔍 Verifying migration...');
    const oldCounts = {};
    const newCounts = {};
    
    for (const table of tables) {
      const tableName = table.table_name;
      try {
        const oldCount = await oldDb.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${tableName}"`);
        const newCount = await newDb.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${tableName}"`);
        
        oldCounts[tableName] = oldCount[0].count;
        newCounts[tableName] = newCount[0].count;
        
        if (oldCount[0].count === newCount[0].count) {
          console.log(`  ✅ ${tableName}: ${newCount[0].count} rows (match)`);
        } else {
          console.log(`  ⚠️  ${tableName}: old=${oldCount[0].count}, new=${newCount[0].count} (mismatch)`);
        }
      } catch (error) {
        console.error(`  ❌ Error verifying table ${tableName}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await oldDb.$disconnect();
    await newDb.$disconnect();
  }
}

// Run migration
migrateData().catch(console.error);
