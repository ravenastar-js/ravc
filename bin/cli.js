#!/usr/bin/env node

/**
 * 📦 Módulo Principal da CLI RAVC
 * @file Processa argumentos de linha de comando e inicia a aplicação
 * @module cli
 */

const ravc = require('../lib/index.js');

// 🎯 Captura argumentos da linha de comando (ignora node e script path)
const args = process.argv.slice(2);

/**
 * 🗺️ Mapeamento de comandos curtos para comandos completos
 * @type {Object}
 */
const commandMap = {
    '-g': 'google',
    '-b': 'bacen', 
    '-u': 'update',
    '-h': 'help',
    '--google': 'google',
    '--bacen': 'bacen',
    '--update': 'update',
    '--help': 'help'
};

/**
 * 🔄 Processa argumentos da linha de comando
 * @type {Array}
 */
let processedArgs = [];
if (args.length > 0) {
    const command = commandMap[args[0]] || args[0];
    processedArgs = [command];
}

// ℹ️ Exibe ajuda se solicitado pelo usuário
if (processedArgs[0] === 'help') {
    console.log(`
🚀 RAVC - CLI de Cotação de Moedas

USO:
  ravc                 Menu interativo completo
  ravc google          Usa Google Finance direto
  ravc bacen           Usa Banco Central direto  
  ravc update          Modo atualização contínua

OPÇÕES:
  -g, --google         Google Finance direto
  -b, --bacen          Banco Central direto
  -u, --update         Atualização contínua
  -h, --help           Mostra esta ajuda

EXEMPLOS:
  ravc                 Menu completo
  ravc -g              Google Finance
  ravc update          Atualiza a cada 5min

📖 Mais info: https://github.com/ravenastar-js/ravc
    `);
    process.exit(0);
}

/**
 * 🚀 Inicia a aplicação principal
 * @async
 * @function startApplication
 */
ravc.start(processedArgs).catch(error => {
    console.error('💥 Falha crítica ao iniciar RAVC:', error.message);
    process.exit(1);
});