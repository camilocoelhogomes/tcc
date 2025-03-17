import esbuild from 'esbuild'; // Use ES module import

const outputDir = './dist';
const outputFile = `${outputDir}/index.js`;

// Build the bundled file
esbuild.build({
  entryPoints: ['./src/index.js'], // Caminho para o arquivo principal
  bundle: true,                   // Agrupa todas as dependências
  minify: true,                   // Minifica o código
  platform: 'node',               // Define o ambiente como Node.js
  target: 'node22',               // Define a versão do Node.js
  format: 'cjs',                  // Define o formato como CommonJS
  sourcemap: true,                // Gera um arquivo de mapa de origem para depuração
  outfile: outputFile,            // Arquivo de saída
}).then(() => {
  console.log('Build completed successfully.');
}).catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});
