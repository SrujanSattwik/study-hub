// Test script for materials API
// Run with: node test-api.js

const API_BASE = 'http://localhost:5500/api/materials';

async function testAPI() {
    console.log('🧪 Testing Materials API...\n');

    // Test 1: Add material via link
    console.log('Test 1: Upload material with link');
    try {
        const response = await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'Test Video - Linear Algebra',
                description: 'MIT OpenCourseWare test video',
                link: 'https://youtube.com/watch?v=test123'
            })
        });
        const result = await response.json();
        console.log('✅ Material created:', result.id);
        console.log('   Type:', result.type, '| Format:', result.format);
    } catch (error) {
        console.log('❌ Failed:', error.message);
    }

    // Test 2: Fetch materials (page 1)
    console.log('\nTest 2: Fetch textbooks (page 1)');
    try {
        const response = await fetch(`${API_BASE}?type=textbook&page=1&limit=5`);
        const result = await response.json();
        console.log('✅ Fetched:', result.materials.length, 'materials');
        console.log('   Page:', result.page, '/', result.totalPages);
        console.log('   Total items:', result.totalItems);
    } catch (error) {
        console.log('❌ Failed:', error.message);
    }

    // Test 3: Fetch all materials
    console.log('\nTest 3: Fetch all materials');
    try {
        const response = await fetch(`${API_BASE}?page=1&limit=100`);
        const result = await response.json();
        console.log('✅ Total materials in database:', result.totalItems);
        
        // Count by type
        const types = {};
        result.materials.forEach(m => {
            types[m.type] = (types[m.type] || 0) + 1;
        });
        console.log('   By type:', types);
    } catch (error) {
        console.log('❌ Failed:', error.message);
    }

    console.log('\n✨ Tests complete!');
}

// Run tests
testAPI();
