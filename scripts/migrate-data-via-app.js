#!/usr/bin/env node
/**
 * Data migration via Prisma clients.
 * Requires OLD_DATABASE_URL and NEW_DATABASE_URL environment variables.
 * Do not embed production credentials in this repository.
 */

const { PrismaClient } = require('@prisma/client');

function requireUrl(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`ERROR: ${name} is not set.`);
    console.error('Obtain connection URLs from Secret Manager / an authorized channel.');
    console.error('Do not hard-code credentials in this file.');
    process.exit(1);
  }
  return value;
}

const oldDb = new PrismaClient({
  datasources: { db: { url: requireUrl('OLD_DATABASE_URL') } },
});

const newDb = new PrismaClient({
  datasources: { db: { url: requireUrl('NEW_DATABASE_URL') } },
});

async function migrateData() {
  console.log('Starting data migration (connection URLs not logged)...');

  try {
    console.log('Testing database connections...');
    await oldDb.$connect();
    console.log('Connected to old database');
    await newDb.$connect();
    console.log('Connected to new database');

    const tables = await oldDb.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    console.log(`Found ${tables.length} tables to migrate`);

    for (const table of tables) {
      const tableName = table.table_name;
      console.log(`Migrating table: ${tableName}`);

      try {
        const data = await oldDb.$queryRawUnsafe(`SELECT * FROM "${tableName}"`);
        if (data.length === 0) {
          console.log(`  Table ${tableName} is empty, skipping...`);
          continue;
        }

        await newDb.$executeRawUnsafe(`DELETE FROM "${tableName}"`);

        const batchSize = 100;
        for (let i = 0; i < data.length; i += batchSize) {
          const batch = data.slice(i, i + batchSize);
          if (batch.length === 0) continue;

          const columns = Object.keys(batch[0]);
          const values = batch
            .map((row) => {
              const cells = columns.map((col) => {
                const value = row[col];
                if (value === null) return 'NULL';
                if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
                if (typeof value === 'boolean') return value;
                if (value instanceof Date) return `'${value.toISOString()}'`;
                if (typeof value === 'object') {
                  return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
                }
                return value;
              });
              return `(${cells.join(', ')})`;
            })
            .join(', ');

          const insertQuery = `INSERT INTO "${tableName}" (${columns
            .map((c) => `"${c}"`)
            .join(', ')}) VALUES ${values}`;
          await newDb.$executeRawUnsafe(insertQuery);
        }

        console.log(`  Migrated ${data.length} rows`);
      } catch (error) {
        console.error(`  Error migrating table ${tableName}:`, error.message);
      }
    }

    console.log('Verifying row counts...');
    for (const table of tables) {
      const tableName = table.table_name;
      try {
        const oldCount = await oldDb.$queryRawUnsafe(
          `SELECT COUNT(*) as count FROM "${tableName}"`
        );
        const newCount = await newDb.$queryRawUnsafe(
          `SELECT COUNT(*) as count FROM "${tableName}"`
        );
        const oc = oldCount[0].count;
        const nc = newCount[0].count;
        if (oc === nc) {
          console.log(`  ${tableName}: ${nc} rows (match)`);
        } else {
          console.log(`  ${tableName}: old=${oc}, new=${nc} (mismatch)`);
        }
      } catch (error) {
        console.error(`  Error verifying table ${tableName}:`, error.message);
      }
    }

    console.log('Data migration completed!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await oldDb.$disconnect();
    await newDb.$disconnect();
  }
}

migrateData().catch((err) => {
  console.error(err);
  process.exit(1);
});
