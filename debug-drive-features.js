// Debug script to check Drive feature access
// Run this in the browser console when on the Drive page

console.log('🔍 Drive Feature Debug Script');

const debugDriveFeatures = async () => {
  try {
    // Check current session and context
    console.log('📋 Current Context:');
    console.log('- URL:', window.location.href);
    console.log('- Dashboard ID from URL:', window.location.pathname.includes('/dashboard/') ? window.location.pathname.split('/dashboard/')[1]?.split('/')[0] : 'Not in dashboard');
    
    // Check if we can access the dashboard context
    if (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
      console.log('React DevTools available');
    }
    
    // Check localStorage for any dashboard context
    const dashboardContext = Object.keys(localStorage).filter(k => k.includes('dashboard') || k.includes('business'));
    console.log('Dashboard-related localStorage keys:', dashboardContext);
    
    // Try to make API calls to check features
    console.log('\n🌐 Feature Check:');
    
    // Check drive_advanced_sharing feature
    const featureCheck = await fetch('/api/features/check?feature=drive_advanced_sharing', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('next-auth.session-token') || 'no-token'}` }
    });
    
    if (featureCheck.ok) {
      const featureData = await featureCheck.json();
      console.log('drive_advanced_sharing feature:', featureData);
    } else {
      console.log('Feature check failed:', featureCheck.status, featureCheck.statusText);
    }
    
    // Check all features
    const allFeatures = await fetch('/api/features/all', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('next-auth.session-token') || 'no-token'}` }
    });
    
    if (allFeatures.ok) {
      const featuresData = await allFeatures.json();
      console.log('All features:', featuresData);
      
      // Filter drive-related features
      const driveFeatures = Object.entries(featuresData.features || {})
        .filter(([key, feature]) => key.includes('drive') || feature.module === 'drive');
      console.log('Drive features:', driveFeatures);
    }
    
    // Check subscription info
    console.log('\n💳 Subscription Check:');
    const subscriptionCheck = await fetch('/api/subscription/current', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('next-auth.session-token') || 'no-token'}` }
    });
    
    if (subscriptionCheck.ok) {
      const subscriptionData = await subscriptionCheck.json();
      console.log('Current subscription:', subscriptionData);
    } else {
      console.log('Subscription check failed:', subscriptionCheck.status, subscriptionCheck.statusText);
    }
    
  } catch (error) {
    console.error('Debug script error:', error);
  }
};

// Auto-run the debug
debugDriveFeatures();

console.log('\n📝 Instructions:');
console.log('1. Look for "drive_advanced_sharing" feature access');
console.log('2. Check if you have business_basic tier or higher');
console.log('3. Verify if you\'re in a business dashboard context');
console.log('4. If not, you\'ll see the basic Drive module instead of Enhanced');
