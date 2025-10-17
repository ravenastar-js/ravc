const inquirer = require('inquirer');
const packageInfo = require('./utils/packageInfo');
const converter = require('./converter');
const { colors, theme } = require('./config/colors');
const boxManager = require('./utils/box');
const uiConfig = require('./config/ui.json');
const logger = require('./utils/logger');
const scraper = require('./scraper');
const Updater = require('./updater');

/**
 * 🎨 Sistema de Interface de Usuário
 * @class UI
 * @description Gerencia menus interativos e experiência do usuário
 */
class UI {
    /**
     * 🏗️ Construtor da classe UI
     * @constructor
     */
    constructor() {
        this.appConfig = packageInfo.allInfo;
        this.config = uiConfig;
        this.updater = new Updater(scraper, converter);
        this.currentExchangeData = null;
        this.updateCount = 0;
    }

    /**
     * 🚀 Inicia a interface baseada nos argumentos
     * @param {Array} args - Argumentos da CLI
     * @returns {Promise<void>}
     */
    async start(args = []) {
        const command = args[0];

        switch (command) {
            case 'google':
                await this.directSource('Google Finance');
                break;
            case 'bacen':
                await this.directSource('Banco Central API');
                break;
            case 'update':
                await this.continuousUpdateMode();
                break;
            default:
                await this.showMainMenu();
        }
    }

    /**
     * 🎯 Modo de fonte direta
     * @param {string} sourceName - Nome da fonte
     * @returns {Promise<void>}
     */
    async directSource(sourceName) {
        logger.info(`Modo direto: ${sourceName}`);

        try {
            const sourceConfig = require('./config/scraping.json').sources
                .find(s => s.name === sourceName && s.enabled);

            if (!sourceConfig) {
                throw new Error(`❌ Fonte ${sourceName} não disponível`);
            }

            const exchangeData = await scraper.trySource(sourceConfig);

            if (!exchangeData) {
                throw new Error(`❌ Falha ao obter dados de ${sourceName}`);
            }

            this.currentExchangeData = exchangeData;
            this.showWelcome();
            this.showRateBox(exchangeData);
            await this.showQuickMenu();

        } catch (error) {
            logger.error(`Erro no modo direto (${sourceName}):`, error.message);
            this.showError(`❌ Falha no ${sourceName}: ${error.message}`);
            await this.delay(3000);
            await this.showMainMenu();
        }
    }

    /**
     * 🔄 Modo de atualização contínua
     * @returns {Promise<void>}
     */
    async continuousUpdateMode() {
        logger.info('Modo de atualização contínua ativado');

        console.clear();
        console.log(boxManager.createBox(
            [
                colors.title('🔁 MODO ATUALIZAÇÃO CONTÍNUA'),
                colors.muted('─'.repeat(30)),
                '',
                colors.text('🕐 Atualizando a cada 1 minuto'),
                colors.text('📁 Logs salvos em /logs/variation-YYYY-MM-DD.txt'),
                colors.text('🛑 Pressione Ctrl+C para parar'),
                '',
                colors.muted('🚀 Iniciando...')
            ].join('\n'), {
            borderColor: colors.info,
            width: 60
        }
        ));

        this.updateCount = 0;
        this.updater.startContinuousUpdate(1, (exchangeData, updateNumber) => {
            this.updateCount++;
            this.displayUpdateResult(exchangeData, updateNumber);
        });

        // ⏳ Mantém o processo rodando com tratamento de Ctrl+C
        return new Promise((resolve) => {
            process.on('SIGINT', () => {
                this.updater.stopContinuousUpdate();
                console.clear();
                console.log(colors.success('✅ Atualização contínua parada. Saindo...'));
                process.exit(0);
            });
        });
    }

    /**
     * 🎪 Mostra menu principal interativo
     * @returns {Promise<void>}
     */
    async showMainMenu() {
        this.showWelcome();

        if (!this.currentExchangeData) {
            this.currentExchangeData = await this.fetchExchangeRate();
        }

        this.showRateBox(this.currentExchangeData);

        while (true) {
            try {
                const { action } = await inquirer.prompt([
                    {
                        type: 'list',
                        name: 'action',
                        prefix: '',
                        message: colors.accent('🎯 SELECIONE UMA OPÇÃO'),
                        choices: [
                            {
                                name: '💰  Converter USD → BRL',
                                value: 'usd_to_brl',
                                short: 'USD/BRL'
                            },
                            {
                                name: '💵  Converter BRL → USD',
                                value: 'brl_to_usd',
                                short: 'BRL/USD'
                            },
                            {
                                name: '🔄  Atualizar Cotação',
                                value: 'refresh',
                                short: 'Atualizar'
                            },
                            {
                                name: '🔁  Atualização Contínua',
                                value: 'continuous_update',
                                short: 'Contínuo'
                            },
                            {
                                name: '📊  Informações',
                                value: 'info',
                                short: 'Info'
                            },
                            new inquirer.Separator(colors.muted('─'.repeat(30))),
                            {
                                name: '🧹  Limpar e Sair',
                                value: 'clean_exit',
                                short: 'Limpar'
                            },
                            {
                                name: '❌  Sair',
                                value: 'exit',
                                short: 'Sair'
                            }
                        ],
                        pageSize: 13,
                        loop: false
                    }
                ]);

                await this.handleMenuAction(action);

            } catch (error) {
                logger.error('Erro no menu principal:', error);
                this.showError('❌ Erro no menu. Continuando...');
                await this.delay(2000);
            }
        }
    }

    /**
     * 🎮 Manipula ações do menu
     * @param {string} action - Ação selecionada
     * @returns {Promise<void>}
     */
    async handleMenuAction(action) {
        switch (action) {
            case 'usd_to_brl':
                await this.convertUSDtoBRL(this.currentExchangeData.rate, this.currentExchangeData);
                // 🧹 Limpa e volta ao menu após conversão
                console.clear();
                this.showWelcome();
                this.showRateBox(this.currentExchangeData);
                break;
            case 'brl_to_usd':
                await this.convertBRLtoUSD(this.currentExchangeData.rate, this.currentExchangeData);
                // 🧹 Limpa e volta ao menu após conversão
                console.clear();
                this.showWelcome();
                this.showRateBox(this.currentExchangeData);
                break;
            case 'refresh':
                this.currentExchangeData = await this.fetchExchangeRate();
                // 🧹 Limpa e mostra dados atualizados
                console.clear();
                this.showWelcome();
                this.showRateBox(this.currentExchangeData);
                break;
            case 'continuous_update':
                await this.showContinuousUpdateMenu();
                break;
            case 'info':
                await this.showInfo();
                // 🧹 Limpa e volta ao menu
                console.clear();
                this.showWelcome();
                this.showRateBox(this.currentExchangeData);
                break;
            case 'clean_exit':
                await this.showCleanExitConfirmation();
                break;
            case 'exit':
                // 🧹 Limpa e mostra mensagem de saída
                console.clear();
                this.showExitMessage();
                process.exit(0);
        }
    }

    /**
     * 🧹 Mostra confirmação para limpar logs e sair
     * @returns {Promise<void>}
     */
    async showCleanExitConfirmation() {
        console.clear();

        // ⚠️ Banner informativo sobre a limpeza
        const warningContent = [
            colors.highlight2('🟡 LIMPEZA DE LOGS'),
            colors.muted('─'.repeat(35)),
            '',
            colors.text('📋 Esta ação irá:'),
            '',
            colors.text('• 🗑️  Apagar TODOS os arquivos da pasta 📁 logs'),
            colors.text('• 📊 Remover histórico de variações'),
            colors.text('• 📈 Excluir dados de sessões anteriores'),
            colors.text('• 🔄 Limpar estatísticas acumuladas'),
            '',
            colors.danger('🔴 Esta ação NÃO PODE ser desfeita!'),
        ].join('\n');

        console.log(boxManager.createBox(warningContent, {
            borderStyle: 'classic',
            borderColor: theme.border.warning2,
            width: 60,
            padding: { top: 1, bottom: 1, left: 2, right: 2 },
            textAlignment: 'left'
        }));

        const { confirm } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                prefix: '',
                message: colors.highlight2('✅ Confirmar limpeza dos logs e sair?'),
                default: false
            }
        ]);

        if (confirm) {
            await this.performCleanExit();
        } else {
            // ↩️ Volta ao menu principal se cancelar
            console.clear();
            this.showWelcome();
            this.showRateBox(this.currentExchangeData);
        }
    }

    /**
     * 🗑️ Executa a limpeza dos logs e sai
     * @returns {Promise<void>}
     */
    async performCleanExit() {
        try {
            const fs = require('fs');
            const path = require('path');
            const logsDir = path.join(process.cwd(), 'logs');

            // 📁 Verifica se a pasta logs existe
            if (fs.existsSync(logsDir)) {
                // 📄 Lista todos os arquivos na pasta logs
                const files = fs.readdirSync(logsDir);
                let deletedCount = 0;

                // 🗑️ Deleta cada arquivo
                for (const file of files) {
                    try {
                        const filePath = path.join(logsDir, file);
                        fs.unlinkSync(filePath);
                        deletedCount++;
                    } catch (error) {
                        logger.error(`Erro ao deletar ${file}:`, error.message);
                    }
                }

                // 🗂️ Tenta deletar a pasta (pode falhar se não estiver vazia)
                try {
                    fs.rmdirSync(logsDir);
                } catch (error) {
                    // 🔇 Ignora erro se a pasta não estiver vazia
                }

                console.clear();

                // ✅ Banner de sucesso
                const successContent = [
                    colors.success('✅ LIMPEZA CONCLUÍDA'),
                    colors.muted('─'.repeat(25)),
                    '',
                    colors.text(`🗑️  ${deletedCount} arquivos deletados`),
                    colors.text('📁 Pasta /logs/ limpa com sucesso'),
                    colors.text('📊 Histórico removido'),
                ].join('\n');

                console.log(boxManager.createBox(successContent, {
                    borderStyle: 'classic',
                    borderColor: theme.border.success,
                    width: 50,
                    padding: { top: 1, bottom: 1, left: 2, right: 2 },
                    textAlignment: 'left'
                }));

                // ⏳ Aguarda um pouco para mostrar a mensagem
                await this.delay(3000);

            } else {
                console.clear();

                // ℹ️ Banner se não houver logs
                const noLogsContent = [
                    colors.info('ℹ️  NENHUM LOG ENCONTRADO'),
                    colors.muted('─'.repeat(30)),
                    '',
                    colors.text('📂 A pasta /logs/ não existe'),
                    colors.text('ou já está vazia.'),
                    '',
                    colors.muted('🔄 Nenhuma ação necessária.')
                ].join('\n');

                console.log(boxManager.createBox(noLogsContent, {
                    borderStyle: 'classic',
                    borderColor: theme.border.info,
                    width: 50,
                    padding: { top: 1, bottom: 1, left: 2, right: 2 },
                    textAlignment: 'center'
                }));

                await this.delay(2000);
            }

        } catch (error) {
            console.clear();

            // ❌ Banner de erro
            const errorContent = [
                colors.error('❌ ERRO NA LIMPEZA'),
                colors.muted('─'.repeat(25)),
                '',
                colors.text('⚠️ Ocorreu um erro durante a limpeza:'),
                colors.text(error.message),
                '',
                colors.muted('📁 Os logs podem não ter sido completamente removidos.')
            ].join('\n');

            console.log(boxManager.createBox(errorContent, {
                borderStyle: 'single',
                borderColor: theme.border.error,
                width: 55,
                padding: { top: 1, bottom: 1, left: 2, right: 2 },
                textAlignment: 'left'
            }));

            await this.delay(3000);

        } finally {
            // 🚪 Sai do aplicativo
            process.exit(0);
        }
    }

    /**
     * 🔄 Mostra menu de atualização contínua
     * @returns {Promise<void>}
     */
    async showContinuousUpdateMenu() {
        const { interval } = await inquirer.prompt([
            {
                type: 'number',
                name: 'interval',
                prefix: '',
                message: colors.accent('⏱️  Intervalo (minutos):'),
                default: 1,
                validate: input => input > 0 && input <= 60 || '❌ Entre 1 e 60 minutos'
            }
        ]);

        this.showWelcome();
        this.showRateBox(this.currentExchangeData);

        console.log(boxManager.createBox(
            [
                colors.info('🔁 ATUALIZAÇÃO CONTÍNUA'),
                colors.muted('─'.repeat(25)),
                '',
                colors.text(`⏰ Intervalo: ${interval} minuto(s)`),
                colors.text('📊 Logs: /logs/variation-YYYY-MM-DD.txt'),
                colors.text('🛑 Pressione Enter para parar'),
                '',
                colors.muted('🚀 Iniciando monitoramento...')
            ].join('\n'), {
            borderColor: colors.info,
            width: 55
        }
        ));

        this.updateCount = 0;
        this.updater.startContinuousUpdate(interval, (exchangeData, updateNumber) => {
            this.updateCount++;
            this.displayUpdateResult(exchangeData, updateNumber);
        });

        await inquirer.prompt([
            {
                type: 'input',
                name: 'stop',
                message: colors.muted('🛑 Pressione Enter para parar a atualização...'),
            }
        ]);

        this.updater.stopContinuousUpdate();

        // 🧹 Limpa e mostra mensagem de sucesso
        console.clear();
        console.log(colors.success('✅ Atualização contínua parada'));
        await this.delay(1500);

        // ↩️ Volta ao menu principal com banner
        await this.showMainMenu();
    }

    /**
     * 🎪 Mostra menu rápido para modos diretos
     * @returns {Promise<void>}
     */
    async showQuickMenu() {
        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                prefix: '',
                message: colors.accent('🎯 PRÓXIMA AÇÃO'),
                choices: [
                    {
                        name: '💰  Converter com esta cotação',
                        value: 'convert'
                    },
                    {
                        name: '🔄  Voltar ao menu principal',
                        value: 'main_menu'
                    },
                    {
                        name: '❌  Sair',
                        value: 'exit'
                    }
                ],
                loop: false
            }
        ]);

        if (action === 'convert') {
            const result = await this.showConversionMenu();
            if (result && result.action === 'back') {
                await this.showQuickMenu();
            }
        } else if (action === 'main_menu') {
            await this.showMainMenu();
        } else {
            this.showExitMessage();
            process.exit(0);
        }
    }

    /**
     * 💰 Mostra menu de conversão
     * @returns {Promise<Object>} Resultado da ação
     */
    async showConversionMenu() {
        const { direction } = await inquirer.prompt([
            {
                type: 'list',
                name: 'direction',
                prefix: '',
                message: colors.accent('🔄 DIREÇÃO DA CONVERSÃO'),
                choices: [
                    {
                        name: '💵 USD → BRL',
                        value: 'usd_to_brl'
                    },
                    {
                        name: '💰 BRL → USD',
                        value: 'brl_to_usd'
                    },
                    {
                        name: '↩️  Voltar',
                        value: 'back'
                    }
                ],
                loop: false
            }
        ]);

        if (direction === 'back') return { action: 'back' };

        if (direction === 'usd_to_brl') {
            return await this.convertUSDtoBRL(this.currentExchangeData.rate, this.currentExchangeData);
        } else {
            return await this.convertBRLtoUSD(this.currentExchangeData.rate, this.currentExchangeData);
        }
    }

    /**
     * 💵 Converte USD para BRL
     * @param {number} exchangeRate - Taxa de câmbio
     * @param {Object} exchangeData - Dados da cotação
     * @returns {Promise<Object>} Resultado da conversão
     */
    async convertUSDtoBRL(exchangeRate, exchangeData) {
        try {
            const { amount } = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'amount',
                    prefix: '',
                    message: colors.usd('💵 Quantos dólares (USD) quer converter?'),
                    validate: input => {
                        const validation = converter.validateAmount(input);
                        return validation.isValid || validation.error;
                    },
                    filter: input => input.replace(',', '.')
                }
            ]);

            const validation = converter.validateAmount(amount);
            const usdAmount = validation.value;
            const brlAmount = converter.convert(usdAmount, 'USD', 'BRL', exchangeRate);

            return await this.showConversionResult(
                converter.formatCurrency(usdAmount, 'USD'),
                converter.formatCurrency(brlAmount, 'BRL'),
                converter.formatRate(exchangeRate),
                'USD → BRL',
                exchangeData?.source || 'Banco Central (Backup)'
            );
        } catch (error) {
            logger.error('Erro na conversão USD para BRL:', error);
            throw error;
        }
    }

    /**
     * 💰 Converte BRL para USD
     * @param {number} exchangeRate - Taxa de câmbio
     * @param {Object} exchangeData - Dados da cotação
     * @returns {Promise<Object>} Resultado da conversão
     */
    async convertBRLtoUSD(exchangeRate, exchangeData) {
        try {
            const { amount } = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'amount',
                    prefix: '',
                    message: colors.brl('💵 Quantos reais (BRL) quer converter?'),
                    validate: input => {
                        const validation = converter.validateAmount(input);
                        return validation.isValid || validation.error;
                    },
                    filter: input => input.replace(',', '.')
                }
            ]);

            const validation = converter.validateAmount(amount);
            const brlAmount = validation.value;
            const usdAmount = converter.convert(brlAmount, 'BRL', 'USD', exchangeRate);

            return await this.showConversionResult(
                converter.formatCurrency(brlAmount, 'BRL'),
                converter.formatCurrency(usdAmount, 'USD'),
                converter.formatRate(1 / exchangeRate),
                'BRL → USD',
                exchangeData?.source || 'Banco Central (Backup)'
            );
        } catch (error) {
            logger.error('Erro na conversão BRL para USD:', error);
            throw error;
        }
    }

    /**
     * 📊 Mostra resultado da conversão
     * @param {string} from - Valor de origem formatado
     * @param {string} to - Valor convertido formatado
     * @param {string} rate - Taxa utilizada
     * @param {string} direction - Direção da conversão
     * @param {string} source - Fonte dos dados
     * @returns {Promise<Object>} Próxima ação
     */
    async showConversionResult(from, to, rate, direction, source) {
        try {
            console.log(boxManager.createConversionResultBox(from, to, rate, direction, source));

            const { nextAction } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'nextAction',
                    prefix: '',
                    message: colors.accent('💫 PRÓXIMA AÇÃO'),
                    choices: [
                        {
                            name: '🔄  Nova conversão',
                            value: 'another'
                        },
                        {
                            name: '📊  Voltar ao menu principal',
                            value: 'back'
                        },
                        new inquirer.Separator(),
                        {
                            name: '❌  Sair',
                            value: 'exit'
                        }
                    ],
                    loop: false
                }
            ]);

            // 🧹 Limpa a tela antes de qualquer ação
            console.clear();

            if (nextAction === 'another') {
                return { action: 'another' };
            } else if (nextAction === 'back') {
                return { action: 'back' };
            } else {
                this.showExitMessage();
                process.exit(0);
            }

        } catch (error) {
            logger.error('Erro ao mostrar resultado:', error);
            console.clear();
            return { action: 'back' };
        }
    }

    /**
     * 📊 Exibe resultado da atualização com formato melhorado
     * @param {Object} exchangeData - Dados da cotação
     * @param {number} updateNumber - Número da atualização
     */
    displayUpdateResult(exchangeData, updateNumber) {
        const now = new Date();
        const dateFormatted = now.toLocaleDateString('pt-BR');
        const timeFormatted = now.toLocaleTimeString('pt-BR');

        // 📈 Obtém informações da sessão atual
        const sessionInfo = this.updater.getSessionInfo();
        const sessionNumber = sessionInfo.sessionNumber || 1;

        // 💰 Usa o mesmo formato do box principal
        const rateFormatted = converter.formatCurrency(1, 'USD') + ' = ' +
            converter.formatCurrency(exchangeData.rate, 'BRL');

        // 📊 Usa os dados exatos do scraper (mesmo do box)
        const variation = exchangeData.variation;
        const direction = exchangeData.variationDirection;
        const symbol = exchangeData.variationSymbol;

        // 🎯 Determina cor baseada na direção (igual ao box)
        let directionColor;
        let changeText = '';

        if (direction === 'up') {
            directionColor = colors.up;
            // 📈 Extrai o valor positivo do variation.value
            const changeMatch = variation.value.match(/(\d+\.?\d*)/);
            if (changeMatch) {
                changeText = `(+${changeMatch[0]})`;
            } else {
                changeText = '(+)';
            }
        } else if (direction === 'down') {
            directionColor = colors.down;
            // 📉 Extrai o valor negativo do variation.value
            const changeMatch = variation.value.match(/(-?\d+\.?\d*)/);
            if (changeMatch) {
                changeText = `(${changeMatch[0]})`;
            } else {
                changeText = '(-)';
            }
        } else {
            directionColor = colors.stable;
            changeText = '(=)';
        }

        // 📝 Formata exatamente como nos logs, mas com cores
        const infoLine = [
            colors.info(`📡 ${exchangeData.source} (Sessão #${sessionNumber} - Atualização #${updateNumber})`),
            colors.muted('─'.repeat(45)),
            colors.dim(`📅${dateFormatted} 🕒${timeFormatted}`),
            colors.text(`💵 ${rateFormatted}`),
            directionColor(`${symbol} ${variation.percent} ${changeText}`),
            '' // 📄 Linha em branco para separação
        ].join('\n');

        console.log(infoLine);

        // ⚠️ Log adicional apenas para variações muito significativas (> 1%)
        if (variation.percent) {
            const percentValue = parseFloat(variation.percent.replace('%', ''));
            if (Math.abs(percentValue) > 1.0) {
                const alertSymbol = direction === 'up' ? '🚀' : '🔻';
                console.log(colors.warning(`   ${alertSymbol} Variação significativa de ${Math.abs(percentValue).toFixed(2)}%!`));
            }
        }
    }

    // 🛠️ Métodos auxiliares
    /**
     * 🎉 Mostra tela de boas-vindas
     */
    showWelcome() {
        console.clear();
        console.log(boxManager.createWelcomeBox());
    }

    /**
     * 💰 Mostra box de cotação
     * @param {Object} exchangeData - Dados da cotação
     */
    showRateBox(exchangeData) {
        console.log(boxManager.createRateBox(exchangeData, converter));
    }

    /**
     * 🌐 Busca cotação atual
     * @returns {Promise<Object>} Dados da cotação
     */
    async fetchExchangeRate() {
        try {
            logger.update('Buscando cotação...');
            return await scraper.getExchangeRate();
        } catch (error) {
            logger.error('Erro ao buscar cotação:', error);
            return scraper.createFallbackData();
        }
    }

    /**
     * 📊 Mostra informações do sistema
     * @returns {Promise<void>}
     */
    async showInfo() {
        console.clear();
        console.log(boxManager.createInfoBox());
        await inquirer.prompt([{
            type: 'input',
            name: 'continue',
            message: colors.muted('↵ Enter para voltar...'),
        }]);
    }

    /**
     * 👋 Mostra mensagem de saída
     */
    showExitMessage() {
        console.log(boxManager.createExitBox());
    }

    /**
     * ❌ Mostra mensagem de erro
     * @param {string} errorMessage - Mensagem de erro
     */
    showError(errorMessage) {
        console.log(boxManager.createErrorBox(errorMessage));
    }

    /**
     * ⏳ Delay assíncrono
     * @param {number} ms - Milissegundos
     * @returns {Promise} Promise resolvida após delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new UI();