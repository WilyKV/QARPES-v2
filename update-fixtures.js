const { execSync } = require('child_process');

console.log('Updating fixtures with authentic data...');

try {
  // Run the fixtures creation
  execSync('npm run fixtures', { stdio: 'inherit', cwd: '/home/runner/workspace' });
  console.log('Fixtures updated successfully!');
} catch (error) {
  console.error('Error updating fixtures:', error.message);
  process.exit(1);
}