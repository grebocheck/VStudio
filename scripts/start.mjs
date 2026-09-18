import process from 'node:process';

// Keep npm start on built assets on every platform, without requiring dev dependencies.
process.env.NODE_ENV = 'production';
await import('../dist/server.cjs');
