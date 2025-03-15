const esbuild = require('esbuild');
const fs = require('fs');
const archiver = require('archiver');

const outputDir = './dist';
const outputFile = `${outputDir}/index.js`;
const zipFile = `${outputDir}/lambda-payment-function.zip`;

// Build the bundled file
esbuild.build({
  entryPoints: ['./src/index.js'], // Caminho para o arquivo principal
  bundle: true,                   // Agrupa todas as dependências
  minify: true,                   // Minifica o código
  platform: 'node',               // Define o ambiente como Node.js
  target: 'node18',               // Define a versão do Node.js
  outfile: outputFile,            // Arquivo de saída
}).then(() => {
  console.log('Build completed successfully.');

  // Create a ZIP file
  const output = fs.createWriteStream(zipFile);
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', () => {
    console.log(`ZIP file created: ${zipFile} (${archive.pointer()} total bytes)`);
  });

  archive.on('error', (err) => {
    throw err;
  });

  archive.pipe(output);
  archive.file(outputFile, { name: 'index.js' });
  archive.finalize();
}).catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});
