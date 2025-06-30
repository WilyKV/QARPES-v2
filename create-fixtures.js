import { createFixtures } from './server/fixtures.js';

createFixtures()
  .then(() => console.log('✅ Fixtures created successfully!'))
  .catch(error => {
    console.error('❌ Error creating fixtures:', error);
    process.exit(1);
  });