const ui = require('./ui');
const packageInfo = require('./utils/packageInfo');
const logger = require('./utils/logger');

/**
 * 🚀 Classe Principal RAVC
 * @class RAVC
 * @description Coordena todos os componentes do sistema
 */
class RAVC {
    /**
     * 🏗️ Construtor da classe RAVC
     * @constructor
     */
    constructor() {
        this.isRunning = false;
        this.appInfo = packageInfo.allInfo;
    }

    /**
     * 🎯 Inicia a aplicação
     * @param {Array} args - Argumentos da CLI
     * @returns {Promise<void>}
     */
    async start(args = []) {
        if (this.isRunning) {
            logger.warn('⚠️ Aplicação já está em execução');
            return;
        }

        this.isRunning = true;
        logger.start(`🚀 Iniciando ${this.appInfo.name} v${this.appInfo.version}`);

        try {
            // 🔧 Processa argumentos de linha de comando
            await ui.start(args);

        } catch (error) {
            logger.error('💥 Erro crítico na aplicação:', error);
            await this.handleCriticalError(error);
        }
    }

    /**
     * 🛡️ Trata erros críticos
     * @param {Error} error - Erro ocorrido
     * @returns {Promise<void>}
     */
    async handleCriticalError(error) {
        logger.error(`🔄 Erro tratado: ${error.message}`);

        // ⏳ Espera um pouco antes de tentar recuperar
        await new Promise(resolve => setTimeout(resolve, 3000));

        if (this.isRunning) {
            logger.info('🔄 Tentando recuperação...');
            this.start();
        }
    }

    /**
     * ⏹️ Para a aplicação
     */
    stop() {
        this.isRunning = false;
        logger.ex(`🛑 ${this.appInfo.name} encerrado`);
    }

    /**
     * ℹ️ Obtém informações da aplicação
     * @returns {Object} Informações do app
     */
    getInfo() {
        return this.appInfo;
    }
}

// 🌍 Instância global
const ravc = new RAVC();

// 🛡️ Manipuladores de processo
process.on('SIGINT', () => {
    logger.stop('🛑 Encerrando via Ctrl+C...');
    ravc.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.stop('🛑 Encerrando via SIGTERM...');
    ravc.stop();
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('\n💥 ERRO NÃO CAPTURADO:');
    console.error('📝 Mensagem:', error.message);
    console.error('🔍 Stack:', error.stack);
    logger.error('💥 Erro não capturado:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('\n💥 PROMISE REJEITADA NÃO TRATADA:');
    console.error('📝 Motivo:', reason);
    logger.error('💥 Promise rejeitada não tratada:', reason);
    process.exit(1);
});

module.exports = ravc;