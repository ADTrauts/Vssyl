const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testUserNumberGeneration() {
  try {
    console.log('🧪 Testing User Number Generation (3-3-3-7 format)...');
    
    // Test data
    const testLocation = {
      country: 'United States',
      region: 'New York',
      city: 'Manhattan',
      countryCode: '1',
      regionCode: '001'
    };

    // Simulate the user number generation process
    const country = await prisma.country.findUnique({ 
      where: { phoneCode: testLocation.countryCode } 
    });
    
    if (!country) {
      console.log('❌ Country not found');
      return;
    }

    const region = await prisma.region.findUnique({
      where: { countryId_code: { countryId: country.id, code: testLocation.regionCode } }
    });

    if (!region) {
      console.log('❌ Region not found');
      return;
    }

    const town = await prisma.town.findFirst({
      where: { regionId: region.id }
    });

    if (!town) {
      console.log('❌ Town not found');
      return;
    }

    // Generate serial number
    const userSerial = await prisma.userSerial.upsert({
      where: { townId: town.id },
      update: { lastSerial: { increment: 1 } },
      create: { townId: town.id, lastSerial: 1 },
      select: { lastSerial: true }
    });

    // Format the user number
    const serial = String(userSerial.lastSerial).padStart(7, '0');
    const countryCode = country.phoneCode.padStart(3, '0');
    const regionCode = region.code.padStart(3, '0');
    const townCode = town.code.padStart(3, '0');
    
    const userNumber = `${countryCode}-${regionCode}-${townCode}-${serial}`;

    console.log('✅ User Number Generated Successfully!');
    console.log(`📋 Country: ${country.name} (${country.phoneCode})`);
    console.log(`📋 Region: ${region.name} (${region.code})`);
    console.log(`📋 Town: ${town.name} (${town.code})`);
    console.log(`📋 Serial: ${userSerial.lastSerial}`);
    console.log(`🎯 Block ID: ${userNumber}`);
    console.log(`📏 Length: ${userNumber.length} characters`);
    console.log(`🔢 Format: 3-3-3-7 (16 digits total)`);

  } catch (error) {
    console.error('❌ Error testing user number generation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUserNumberGeneration(); 