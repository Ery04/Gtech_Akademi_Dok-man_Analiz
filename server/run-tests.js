const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting comprehensive test suite...\n');

// Test configuration
const testConfig = {
  auth: {
    name: 'Authentication Tests',
    description: 'User registration, login, and JWT token validation',
    tests: [
      'User registration with valid data',
      'User registration with invalid password',
      'User registration with duplicate email',
      'User login with valid credentials',
      'User login with invalid password',
      'User login with non-existent email',
      'Get user profile with valid token',
      'Get user profile without token',
      'Get user profile with invalid token'
    ]
  },
  documents: {
    name: 'Document Management Tests',
    description: 'Document upload, retrieval, and processing',
    tests: [
      'Document upload with authentication',
      'Document upload without authentication',
      'Document upload without file',
      'Get user documents list',
      'Get user documents without authentication',
      'Get document by ID',
      'Access other user document (should fail)',
      'Generate document summary',
      'Return cached summary if exists',
      'Extract keywords from document',
      'Return cached keywords if exist',
      'Search within document',
      'Search with empty query (should fail)',
      'Delete user document',
      'Delete other user document (should fail)'
    ]
  },
  admin: {
    name: 'Admin Functionality Tests',
    description: 'Admin user management and system statistics',
    tests: [
      'Get all users for admin',
      'Get users for regular user (should fail)',
      'Get users without authentication (should fail)',
      'Get system statistics for admin',
      'Get system statistics for regular user (should fail)',
      'Delete user and their documents',
      'Admin delete themselves (should fail)',
      'Delete non-existent user (should fail)',
      'Regular user delete user (should fail)',
      'Admin middleware access control'
    ]
  }
};

// Run tests and collect results
async function runTests() {
  const results = {
    startTime: new Date(),
    tests: {},
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      coverage: 0
    }
  };

  try {
    // Run Jest tests with coverage
    console.log('📋 Running Jest tests with coverage...');
    const jestOutput = execSync('npm test -- --coverage --json', { 
      encoding: 'utf8',
      cwd: __dirname 
    });

    const jestResults = JSON.parse(jestOutput);
    
    // Process test results
    jestResults.testResults.forEach(suite => {
      const suiteName = path.basename(suite.testFilePath, '.js').replace('.test', '');
      results.tests[suiteName] = {
        name: testConfig[suiteName]?.name || suiteName,
        description: testConfig[suiteName]?.description || '',
        status: suite.status,
        duration: suite.endTime - suite.startTime,
        testResults: suite.assertionResults.map(test => ({
          name: test.fullName,
          status: test.status,
          duration: test.duration,
          failureMessages: test.failureMessages
        }))
      };
    });

    // Calculate summary
    results.summary.total = jestResults.numTotalTests;
    results.summary.passed = jestResults.numPassedTests;
    results.summary.failed = jestResults.numFailedTests;
    results.summary.coverage = jestResults.coverageMap ? 
      Object.values(jestResults.coverageMap).reduce((acc, file) => 
        acc + (file.s || 0), 0) / Object.keys(jestResults.coverageMap).length : 0;

    results.endTime = new Date();
    results.duration = results.endTime - results.startTime;

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    results.error = error.message;
  }

  return results;
}

// Generate detailed report
function generateReport(results) {
  const report = {
    title: 'Doküman Analiz Platformu - Test Raporu',
    timestamp: new Date().toISOString(),
    summary: results.summary,
    testSuites: Object.keys(results.tests).map(suiteName => {
      const suite = results.tests[suiteName];
      const config = testConfig[suiteName];
      
      return {
        name: suite.name,
        description: suite.description,
        status: suite.status,
        duration: suite.duration,
        testCount: suite.testResults.length,
        passedCount: suite.testResults.filter(t => t.status === 'passed').length,
        failedCount: suite.testResults.filter(t => t.status === 'failed').length,
        tests: suite.testResults.map(test => ({
          name: test.name,
          status: test.status,
          duration: test.duration,
          failureMessage: test.failureMessages?.[0] || null
        }))
      };
    })
  };

  return report;
}

// Save report to file
function saveReport(report) {
  const reportPath = path.join(__dirname, 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  const markdownPath = path.join(__dirname, 'test-report.md');
  const markdown = generateMarkdownReport(report);
  fs.writeFileSync(markdownPath, markdown);
  
  console.log(`📄 Test report saved to: ${reportPath}`);
  console.log(`📄 Markdown report saved to: ${markdownPath}`);
}

// Generate Markdown report
function generateMarkdownReport(report) {
  let markdown = `# ${report.title}\n\n`;
  markdown += `**Rapor Tarihi:** ${new Date(report.timestamp).toLocaleString('tr-TR')}\n\n`;
  
  // Summary
  markdown += `## 📊 Test Özeti\n\n`;
  markdown += `| Metrik | Değer |\n`;
  markdown += `|--------|-------|\n`;
  markdown += `| Toplam Test | ${report.summary.total} |\n`;
  markdown += `| Başarılı | ${report.summary.passed} |\n`;
  markdown += `| Başarısız | ${report.summary.failed} |\n`;
  markdown += `| Başarı Oranı | ${((report.summary.passed / report.summary.total) * 100).toFixed(2)}% |\n`;
  markdown += `| Kapsama | ${report.summary.coverage.toFixed(2)}% |\n\n`;
  
  // Test Suites
  markdown += `## 🧪 Test Kümeleri\n\n`;
  
  report.testSuites.forEach(suite => {
    const statusIcon = suite.status === 'passed' ? '✅' : '❌';
    markdown += `### ${statusIcon} ${suite.name}\n\n`;
    markdown += `**Açıklama:** ${suite.description}\n\n`;
    markdown += `**Durum:** ${suite.status === 'passed' ? 'Başarılı' : 'Başarısız'}\n`;
    markdown += `**Süre:** ${suite.duration}ms\n`;
    markdown += `**Test Sayısı:** ${suite.testCount} (${suite.passedCount} başarılı, ${suite.failedCount} başarısız)\n\n`;
    
    // Individual tests
    markdown += `#### Test Detayları\n\n`;
    markdown += `| Test Adı | Durum | Süre | Hata Mesajı |\n`;
    markdown += `|----------|-------|------|-------------|\n`;
    
    suite.tests.forEach(test => {
      const testStatus = test.status === 'passed' ? '✅' : '❌';
      const errorMsg = test.failureMessage ? test.failureMessage.substring(0, 50) + '...' : '-';
      markdown += `| ${test.name} | ${testStatus} | ${test.duration}ms | ${errorMsg} |\n`;
    });
    
    markdown += `\n`;
  });
  
  // Failed tests summary
  const failedTests = report.testSuites.flatMap(suite => 
    suite.tests.filter(test => test.status === 'failed')
  );
  
  if (failedTests.length > 0) {
    markdown += `## ❌ Başarısız Testler\n\n`;
    failedTests.forEach(test => {
      markdown += `### ${test.name}\n`;
      markdown += `**Hata:** ${test.failureMessage}\n\n`;
    });
  }
  
  return markdown;
}

// Main execution
async function main() {
  try {
    const results = await runTests();
    const report = generateReport(results);
    saveReport(report);
    
    // Console output
    console.log('\n📊 Test Sonuçları:');
    console.log(`✅ Başarılı: ${results.summary.passed}`);
    console.log(`❌ Başarısız: ${results.summary.failed}`);
    console.log(`📈 Başarı Oranı: ${((results.summary.passed / results.summary.total) * 100).toFixed(2)}%`);
    console.log(`⏱️  Toplam Süre: ${results.duration}ms`);
    
    if (results.summary.failed > 0) {
      console.log('\n❌ Başarısız testler için detaylı raporu kontrol edin.');
      process.exit(1);
    } else {
      console.log('\n🎉 Tüm testler başarıyla geçti!');
    }
    
  } catch (error) {
    console.error('❌ Test raporu oluşturulurken hata:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { runTests, generateReport }; 