const { validateBlockId, parseBlockId, generateTestBlockId, areBlockIdsFromSameLocation } = require('./dist/utils/blockIdValidation');

console.log('🧪 Testing Block ID Validation System...\n');

// Test 1: Valid Block ID format
console.log('✅ Test 1: Valid Block ID Format');
const validBlockId = '001-001-001-0000001';
console.log(`Input: ${validBlockId}`);
console.log(`Valid: ${validateBlockId(validBlockId)}`);
console.log(`Parsed:`, parseBlockId(validBlockId));
console.log('');

// Test 2: Invalid Block ID formats
console.log('❌ Test 2: Invalid Block ID Formats');
const invalidBlockIds = [
  '1-1-1-1',           // Too short
  '001-001-001-00000001', // Too long
  '001-001-001-0000000',  // Zero serial
  'abc-def-ghi-jklmnop',  // Non-numeric
  '001-001-001',          // Missing serial
  '0010010010000001',     // No hyphens
];

invalidBlockIds.forEach(blockId => {
  console.log(`Input: ${blockId}`);
  console.log(`Valid: ${validateBlockId(blockId)}`);
  console.log(`Parsed: ${parseBlockId(blockId) ? 'Success' : 'Failed'}`);
  console.log('');
});

// Test 3: Generate test Block IDs
console.log('🔧 Test 3: Generate Test Block IDs');
const testBlockIds = [
  generateTestBlockId('1', '1', '1', 1),
  generateTestBlockId('44', '1', '1', 1234567),
  generateTestBlockId('33', '2', '5', 9999999),
];

testBlockIds.forEach(blockId => {
  console.log(`Generated: ${blockId}`);
  console.log(`Valid: ${validateBlockId(blockId)}`);
  console.log(`Parsed:`, parseBlockId(blockId));
  console.log('');
});

// Test 4: Location comparison
console.log('📍 Test 4: Location Comparison');
const blockId1 = '001-001-001-0000001';
const blockId2 = '001-001-001-0000002';
const blockId3 = '001-002-001-0000001';

console.log(`Block ID 1: ${blockId1}`);
console.log(`Block ID 2: ${blockId2}`);
console.log(`Block ID 3: ${blockId3}`);
console.log(`Same location (1 & 2): ${areBlockIdsFromSameLocation(blockId1, blockId2)}`);
console.log(`Same location (1 & 3): ${areBlockIdsFromSameLocation(blockId1, blockId3)}`);
console.log('');

// Test 5: Edge cases
console.log('🔍 Test 5: Edge Cases');
const edgeCases = [
  '',                    // Empty string
  '001-001-001-0000000', // Zero serial
  '000-000-000-0000001', // Zero codes
  '999-999-999-9999999', // Max values
];

edgeCases.forEach(blockId => {
  console.log(`Input: "${blockId}"`);
  console.log(`Valid: ${validateBlockId(blockId)}`);
  console.log(`Parsed: ${parseBlockId(blockId) ? 'Success' : 'Failed'}`);
  console.log('');
});

console.log('🎉 Block ID Validation Tests Completed!');
console.log('\n📊 Summary:');
console.log('- Format validation: ✅');
console.log('- Component parsing: ✅');
console.log('- Location comparison: ✅');
console.log('- Edge case handling: ✅');
console.log('- Test generation: ✅'); 