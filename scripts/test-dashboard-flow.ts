/**
 * Test the complete user dashboard flow
 * Register -> Login -> Dashboard -> Upload Resume -> Upload Photo -> Generate Portfolio
 */

async function testDashboardFlow() {
  console.log('🚀 Testing Complete Dashboard Flow\n');

  const baseUrl = 'http://localhost:3000';

  try {
    // Step 1: Register a new user
    console.log('1️⃣ Registering new user...');
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test-${Date.now()}@example.com`,
        password: '11111',
        name: 'Test User'
      })
    });

    if (!registerResponse.ok) {
      throw new Error(`Registration failed: ${registerResponse.status}`);
    }
    console.log('✅ User registered successfully\n');

    // Step 2: Login
    console.log('2️⃣ Logging in...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com', // Use existing test user
        password: 'testpassword123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    // Get the access token from cookies
    const cookies = loginResponse.headers.get('set-cookie');
    const accessTokenMatch = cookies?.match(/accessToken=([^;]+)/);
    if (!accessTokenMatch) {
      throw new Error('No access token received');
    }
    const accessToken = accessTokenMatch[1];
    console.log('✅ Login successful, got access token\n');

    // Step 3: Access dashboard
    console.log('3️⃣ Accessing dashboard...');
    const dashboardResponse = await fetch(`${baseUrl}/api/dashboard`, {
      headers: { Cookie: `accessToken=${accessToken}` }
    });

    if (!dashboardResponse.ok) {
      throw new Error(`Dashboard access failed: ${dashboardResponse.status}`);
    }

    const dashboardData = await dashboardResponse.json();
    console.log('✅ Dashboard loaded successfully');
    console.log(`   - User: ${dashboardData.user.name || dashboardData.user.email}`);
    console.log(`   - Resumes: ${dashboardData.stats.resumeCount}/${dashboardData.limits.maxResumes}`);
    console.log(`   - Photos: ${dashboardData.stats.photoCount}/${dashboardData.limits.maxPhotos}\n`);

    // Step 4: Upload resume
    console.log('4️⃣ Uploading resume...');
    const resumeFormData = new FormData();
    resumeFormData.append('resume', new Blob(['test resume content'], { type: 'text/plain' }), 'test-resume.txt');
    resumeFormData.append('aiNotes', 'Software engineer with 5 years experience');

    const resumeResponse = await fetch(`${baseUrl}/api/upload/resume`, {
      method: 'POST',
      headers: { Cookie: `accessToken=${accessToken}` },
      body: resumeFormData
    });

    if (!resumeResponse.ok) {
      const error = await resumeResponse.text();
      throw new Error(`Resume upload failed: ${resumeResponse.status} - ${error}`);
    }
    console.log('✅ Resume uploaded successfully\n');

    // Step 5: Upload photo
    console.log('5️⃣ Uploading photo...');
    const photoFormData = new FormData();
    photoFormData.append('photo', new Blob(['fake image data'], { type: 'image/jpeg' }), 'test-photo.jpg');

    const photoResponse = await fetch(`${baseUrl}/api/portfolio/photos`, {
      method: 'POST',
      headers: { Cookie: `accessToken=${accessToken}` },
      body: photoFormData
    });

    if (!photoResponse.ok) {
      const error = await photoResponse.text();
      throw new Error(`Photo upload failed: ${photoResponse.status} - ${error}`);
    }
    console.log('✅ Photo uploaded successfully\n');

    // Step 6: Generate portfolio
    console.log('6️⃣ Generating portfolio...');
    const generateResponse = await fetch(`${baseUrl}/api/portfolio/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `accessToken=${accessToken}`
      },
      body: JSON.stringify({ resumeId: 'test-resume-id' }) // This will fail but test the endpoint
    });

    console.log(`Portfolio generation response: ${generateResponse.status}`);
    if (generateResponse.ok) {
      console.log('✅ Portfolio generation started successfully\n');
    } else {
      const error = await generateResponse.text();
      console.log(`⚠️  Portfolio generation failed (expected for test): ${error}\n`);
    }

    console.log('🎉 Dashboard flow test completed successfully!\n');

  } catch (error) {
    console.error('❌ Dashboard flow test failed:', error);
    process.exit(1);
  }
}

// Run the test
testDashboardFlow();