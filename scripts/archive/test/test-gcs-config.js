#!/usr/bin/env node

// Test Google Cloud Storage configuration
const { Storage } = require('@google-cloud/storage');

async function testGCSConfig() {
  console.log('🧪 Testing Google Cloud Storage configuration...');
  
  try {
    // Initialize storage with Application Default Credentials
    const storage = new Storage({
      projectId: 'vssyl-472202'
    });
    
    const bucketName = 'vssyl-storage-472202';
    const bucket = storage.bucket(bucketName);
    
    console.log('📦 Testing bucket access:', bucketName);
    
    // Test if bucket exists and is accessible
    const [exists] = await bucket.exists();
    if (!exists) {
      console.error('❌ Bucket does not exist or is not accessible');
      return;
    }
    
    console.log('✅ Bucket exists and is accessible');
    
    // Test file upload
    const testFileName = `test-${Date.now()}.txt`;
    const file = bucket.file(testFileName);
    
    console.log('📤 Testing file upload...');
    await file.save('Test file content from Vssyl');
    console.log('✅ File upload successful');
    
    // Test file existence
    const [fileExists] = await file.exists();
    if (fileExists) {
      console.log('✅ File exists in bucket');
      
      // Clean up test file
      await file.delete();
      console.log('🧹 Test file cleaned up');
    }
    
    // Test public URL generation
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${testFileName}`;
    console.log('🔗 Public URL format:', publicUrl);
    
    console.log('🎉 Google Cloud Storage configuration test completed successfully!');
    
  } catch (error) {
    console.error('❌ Google Cloud Storage test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testGCSConfig();
