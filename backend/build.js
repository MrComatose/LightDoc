const esbuild = require('esbuild');
const path = require('path');

esbuild.build({
    entryPoints: [path.resolve(__dirname, 'lambda.ts')],  // Entry point for your Lambda
    bundle: true,  // Bundle everything (including dependencies)
    platform: 'node',  // Target platform for Node.js
    target: 'node14',  // Target Lambda's Node.js runtime
    outfile: path.resolve(__dirname, './../dist/backend/lambda.js'),  // Output the bundled file
    external: ['aws-sdk'],  // Exclude AWS SDK (it's already available in Lambda)
    sourcemap: false,  // Optional: include source maps for debugging
}).then(() => {
    console.log('Lambda build complete.');
}).catch((error) => {
    console.error('Build failed:', error);
    process.exit(1);
});
