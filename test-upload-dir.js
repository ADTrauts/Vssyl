#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

// Test directory creation logic
function testUploadDirCreation() {
  console.log('🧪 Testing upload directory creation...');
  
  // Test the same logic used in the controllers
  const uploadDir = process.env.LOCAL_UPLOAD_DIR || path.join(__dirname, 'server/uploads');
  console.log('📁 Upload directory path:', uploadDir);
  
  // Check if directory exists
  if (!fs.existsSync(uploadDir)) {
    console.log('📂 Directory does not exist, creating...');
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('✅ Directory created successfully');
  } else {
    console.log('✅ Directory already exists');
  }
  
  // Test subdirectory creation
  const profilePhotosDir = path.join(uploadDir, 'profile-photos');
  if (!fs.existsSync(profilePhotosDir)) {
    console.log('📂 Creating profile-photos subdirectory...');
    fs.mkdirSync(profilePhotosDir, { recursive: true });
    console.log('✅ Profile photos directory created');
  } else {
    console.log('✅ Profile photos directory already exists');
  }
  
  // Test file write permissions
  const testFile = path.join(uploadDir, 'test.txt');
  try {
    fs.writeFileSync(testFile, 'Test file content');
    console.log('✅ File write test successful');
    fs.unlinkSync(testFile); // Clean up
    console.log('🧹 Test file cleaned up');
  } catch (error) {
    console.error('❌ File write test failed:', error.message);
  }
  
  console.log('🎉 Upload directory test completed');
}

testUploadDirCreation();
