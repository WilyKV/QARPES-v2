const { createFixtures } = require('./server/fixtures.ts');

createFixtures()
  .then(() => console.log('✅ Fixtures created successfully!'))
  .catch(error => {
    console.error('❌ Error creating fixtures:', error);
    process.exit(1);
  });