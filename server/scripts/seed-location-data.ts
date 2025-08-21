import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedLocationData() {
  console.log('🌍 Seeding location data...');

  try {
    // Clear existing data
    await prisma.userSerial.deleteMany();
    await prisma.town.deleteMany();
    await prisma.region.deleteMany();
    await prisma.country.deleteMany();

    // Create countries using findOrCreate pattern
    const usa = await prisma.country.upsert({
      where: { phoneCode: '1' },
      update: {},
      create: {
        name: 'United States',
        phoneCode: '1'
      }
    });

    const uk = await prisma.country.upsert({
      where: { phoneCode: '44' },
      update: {},
      create: {
        name: 'United Kingdom',
        phoneCode: '44'
      }
    });

    const canada = await prisma.country.upsert({
      where: { phoneCode: '1-CA' },
      update: {},
      create: {
        name: 'Canada',
        phoneCode: '1-CA'
      }
    });

    const germany = await prisma.country.upsert({
      where: { phoneCode: '49' },
      update: {},
      create: {
        name: 'Germany',
        phoneCode: '49'
      }
    });

    console.log('✅ Countries created');

    // Create regions for USA (3-digit codes)
    const nyRegion = await prisma.region.upsert({
      where: { countryId_code: { countryId: usa.id, code: '001' } },
      update: {},
      create: {
        name: 'New York',
        code: '001',
        countryId: usa.id
      }
    });

    const caRegion = await prisma.region.upsert({
      where: { countryId_code: { countryId: usa.id, code: '002' } },
      update: {},
      create: {
        name: 'California',
        code: '002',
        countryId: usa.id
      }
    });

    const txRegion = await prisma.region.upsert({
      where: { countryId_code: { countryId: usa.id, code: '003' } },
      update: {},
      create: {
        name: 'Texas',
        code: '003',
        countryId: usa.id
      }
    });

    // Create regions for UK (3-digit codes)
    const englandRegion = await prisma.region.upsert({
      where: { countryId_code: { countryId: uk.id, code: '001' } },
      update: {},
      create: {
        name: 'England',
        code: '001',
        countryId: uk.id
      }
    });

    const scotlandRegion = await prisma.region.upsert({
      where: { countryId_code: { countryId: uk.id, code: '002' } },
      update: {},
      create: {
        name: 'Scotland',
        code: '002',
        countryId: uk.id
      }
    });

    // Create regions for Canada (3-digit codes)
    const ontarioRegion = await prisma.region.upsert({
      where: { countryId_code: { countryId: canada.id, code: '001' } },
      update: {},
      create: {
        name: 'Ontario',
        code: '001',
        countryId: canada.id
      }
    });

    // Create regions for Germany (3-digit codes)
    const bavariaRegion = await prisma.region.upsert({
      where: { countryId_code: { countryId: germany.id, code: '001' } },
      update: {},
      create: {
        name: 'Bavaria',
        code: '001',
        countryId: germany.id
      }
    });

    console.log('✅ Regions created');

    // Create towns for USA (3-digit codes)
    const manhattanTown = await prisma.town.upsert({
      where: { regionId_code: { regionId: nyRegion.id, code: '001' } },
      update: {},
      create: {
        name: 'Manhattan',
        code: '001',
        regionId: nyRegion.id
      }
    });

    const brooklynTown = await prisma.town.upsert({
      where: { regionId_code: { regionId: nyRegion.id, code: '002' } },
      update: {},
      create: {
        name: 'Brooklyn',
        code: '002',
        regionId: nyRegion.id
      }
    });

    const losAngelesTown = await prisma.town.upsert({
      where: { regionId_code: { regionId: caRegion.id, code: '001' } },
      update: {},
      create: {
        name: 'Los Angeles',
        code: '001',
        regionId: caRegion.id
      }
    });

    const sanFranciscoTown = await prisma.town.upsert({
      where: { regionId_code: { regionId: caRegion.id, code: '002' } },
      update: {},
      create: {
        name: 'San Francisco',
        code: '002',
        regionId: caRegion.id
      }
    });

    const houstonTown = await prisma.town.upsert({
      where: { regionId_code: { regionId: txRegion.id, code: '001' } },
      update: {},
      create: {
        name: 'Houston',
        code: '001',
        regionId: txRegion.id
      }
    });

    // Create towns for UK (3-digit codes)
    const londonTown = await prisma.town.upsert({
      where: { regionId_code: { regionId: englandRegion.id, code: '001' } },
      update: {},
      create: {
        name: 'London',
        code: '001',
        regionId: englandRegion.id
      }
    });

    const edinburghTown = await prisma.town.upsert({
      where: { regionId_code: { regionId: scotlandRegion.id, code: '001' } },
      update: {},
      create: {
        name: 'Edinburgh',
        code: '001',
        regionId: scotlandRegion.id
      }
    });

    // Create towns for Canada (3-digit codes)
    const torontoTown = await prisma.town.upsert({
      where: { regionId_code: { regionId: ontarioRegion.id, code: '001' } },
      update: {},
      create: {
        name: 'Toronto',
        code: '001',
        regionId: ontarioRegion.id
      }
    });

    // Create towns for Germany (3-digit codes)
    const munichTown = await prisma.town.upsert({
      where: { regionId_code: { regionId: bavariaRegion.id, code: '001' } },
      update: {},
      create: {
        name: 'Munich',
        code: '001',
        regionId: bavariaRegion.id
      }
    });

    console.log('✅ Towns created');

    // Create UserSerial records for each town
    await prisma.userSerial.createMany({
      data: [
        { townId: manhattanTown.id, lastSerial: 0 },
        { townId: brooklynTown.id, lastSerial: 0 },
        { townId: losAngelesTown.id, lastSerial: 0 },
        { townId: sanFranciscoTown.id, lastSerial: 0 },
        { townId: houstonTown.id, lastSerial: 0 },
        { townId: londonTown.id, lastSerial: 0 },
        { townId: edinburghTown.id, lastSerial: 0 },
        { townId: torontoTown.id, lastSerial: 0 },
        { townId: munichTown.id, lastSerial: 0 },
      ],
      skipDuplicates: true
    });

    console.log('✅ UserSerial records created');

    console.log('🎉 Location data seeding completed successfully!');
    console.log('\n📊 Sample Block IDs that will be generated:');
    console.log('USA-NY-Manhattan: 001-001-001-0000001');
    console.log('USA-NY-Brooklyn:  001-001-002-0000001');
    console.log('USA-CA-LA:        001-002-001-0000001');
    console.log('UK-England-London: 044-001-001-0000001');
    console.log('Germany-Bavaria-Munich: 049-001-001-0000001');

  } catch (error) {
    console.error('❌ Error seeding location data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedLocationData(); 