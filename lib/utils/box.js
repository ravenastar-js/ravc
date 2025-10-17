const { colors, theme } = require('../config/colors');
const packageInfo = require('./packageInfo');
const logger = require('./logger');

/**
 * 🎪 Gerenciador de Boxes Visuais
 * @class BoxManager
 * @description Cria caixas estilizadas para diferentes tipos de conteúdo
 */
class BoxManager {
    /**
     * 🏗️ Construtor da classe BoxManager
     * @constructor
     */
    constructor() {
        this.appInfo = packageInfo.allInfo;
    }

    /**
     * 📦 Cria uma caixa estilizada com conteúdo
     * @param {string} content - Conteúdo da caixa
     * @param {Object} options - Opções de formatação
     * @returns {string} Caixa formatada
     */
    createBox(content, options = {}) {
        try {
            const boxen = require('boxen').default;

            const defaultOptions = {
                padding: 1,
                margin: 1,
                borderStyle: 'single',
                borderColor: theme.border.primary,
                backgroundColor: theme.background,
                width: 60,
                textAlignment: 'center'
            };

            const finalOptions = { ...defaultOptions, ...options };
            return boxen(content, finalOptions);
        } catch (error) {
            logger.debug('Fallback de box ativado:', error);
            return `\n${'═'.repeat(60)}\n${content}\n${'═'.repeat(60)}\n`;
        }
    }

    /**
     * 🎉 Cria box de boas-vindas
     * @returns {string} Box de welcome estilizado
     */
    createWelcomeBox() {
        console.clear();
        try {
            let bannerText;
            try {
                const figlet = require('figlet');
                bannerText = colors.success(
                    figlet.textSync(this.appInfo.name.toUpperCase(), {
                        font: 'Small',
                        horizontalLayout: 'fitted'
                    })
                );
            } catch (figletError) {
                logger.debug('Figlet não disponível, usando fallback');
                bannerText = colors.success.bold(`🚀 ${this.appInfo.name.toUpperCase()} v${this.appInfo.version}`);
            }

            const content = [
                bannerText,
                colors.highlight2(`🌱 v${this.appInfo.version}`),
                '',
                colors.text(`${this.appInfo.description}`),
                '',
                colors.text('Feito com ') + colors.danger('💚') + colors.text(' por ') + colors.primary.bold(this.appInfo.author),
                '',
                colors.text('🔗 ') + colors.link(this.appInfo.website),
                colors.text('🔒 ') + colors.link(this.appInfo.website2),
                '',
                colors.muted('Pressione ') + colors.warning('Ctrl+C') + colors.muted(' para sair')
            ].join('\n');

            return this.createBox(content, {
                borderStyle: 'classic',
                borderColor: theme.border.primary,
                width: 70,
                textAlignment: 'center'
            });
        } catch (error) {
            logger.error('Erro crítico em createWelcomeBox:', error);
            return colors.primary.bold(`🚀 ${this.appInfo.name} v${this.appInfo.version}\n\n`);
        }
    }

    /**
     * ⚠️ Cria box de aviso para limpeza
     * @param {string} content - Conteúdo do aviso
     * @param {Object} options - Opções de formatação
     * @returns {string} Box de aviso
     */
    createWarningBox(content, options = {}) {
        try {
            const boxen = require('boxen').default;

            const defaultOptions = {
                padding: 1,
                margin: 1,
                borderStyle: 'single',
                borderColor: theme.border.warning,
                backgroundColor: theme.background,
                width: 60,
                textAlignment: 'left'
            };

            const finalOptions = { ...defaultOptions, ...options };
            return boxen(content, finalOptions);
        } catch (error) {
            logger.debug('Fallback de warning box ativado:', error);
            return `\n${'⚠️'.repeat(20)}\n${content}\n${'⚠️'.repeat(20)}\n`;
        }
    }

    /**
     * 💰 Cria box compacto de cotação
     * @param {Object} exchangeData - Dados da cotação
     * @param {Object} converter - Instância do conversor
     * @returns {string} Box de cotação otimizado
     */
    createRateBox(exchangeData, converter) {
        try {
            const { rate, variation, source } = exchangeData;
            const directionConfig = this.getDirectionConfig(variation.direction);

            const rateContent = [
                colors.title('💵 COTAÇÃO USD/BRL'),
                colors.muted('─'.repeat(35)),
                '',
                colors.text(`${converter.formatCurrency(1, 'USD')} = ${converter.formatCurrency(rate, 'BRL')}`),
                directionConfig.color(`${directionConfig.symbol} ${variation.percent} (${variation.value})`),
                '',
                colors.muted(`🕒 ${variation.timestamp}`),
                '',
                colors.text(`📡 Fonte: ${colors.info(source)}`)
            ].join('\n');

            return this.createBox(rateContent, {
                borderStyle: 'single',
                borderColor: directionConfig.borderColor,
                width: 50,
                margin: { top: 0, bottom: 1 },
                padding: { top: 1, bottom: 1, left: 1, right: 1 }
            });
        } catch (error) {
            logger.error('Erro em createRateBox:', error);
            return colors.text(`💵 1 USD = ${exchangeData.rate} BRL\n`);
        }
    }

    /**
     * 📊 Cria box de informações do sistema
     * @returns {string} Box informativo compacto
     */
    createInfoBox() {
        try {
            const scrapingConfig = require('../config/scraping.json');
            let bannerText;
            try {
                const figlet = require('figlet');
                bannerText = colors.info(
                    figlet.textSync("INFOR", {
                        font: 'Small',
                        horizontalLayout: 'fitted'
                    })
                );
            } catch (figletError) {
                logger.debug('Figlet não disponível, usando fallback');
                bannerText = colors.success.bold(`📊 INFORMAÇÕES`);
            }

            const infoContent = [
                bannerText,
                colors.muted('─'.repeat(30)),
                '',
                colors.subtitle('🚀 APLICAÇÃO'),
                colors.highlight2(`📦 ${this.appInfo.name} 🌱 v${this.appInfo.version}`),
                colors.text(`${this.appInfo.description}`),
                '',
                '',
                colors.subtitle('🌐 FONTES ATIVAS'),
                ...scrapingConfig.sources.filter(s => s.enabled).map((s, i) =>
                    ` ${colors.text('•')} ${colors.info(s.name)} ${colors.muted(s.reliability)}`
                ),
                '',
                colors.subtitle('💻 TECNOLOGIA'),
                `${colors.text('⚙️')} Runtime: ${colors.info('Node.js ' + process.version)}`,
                `${colors.text('📦')} Dependências: ${colors.info(this.getDependenciesCount())}`,
                `${colors.text('💰')} Moedas: ${colors.success('USD/BRL')}`,
                `${colors.text('🌐')} APIs: ${colors.info('Google Finance + Banco Central')}`,
                `${colors.text('🕷️')} Web Scraping: ${colors.info('Playwright + Chromium')}`,
                `${colors.text('🎨')} UI: ${colors.info('inquirer, boxen, chalk & figlet')}`,
                '',
                colors.muted('Enter para voltar...')
            ].join('\n');

            return this.createBox(infoContent, {
                borderStyle: 'classic',
                borderColor: theme.border.info2,
                width: 55,
                textAlignment: 'left'
            });
        } catch (error) {
            logger.error('Erro em createInfoBox:', error);
            return colors.text('📊 Informações do Sistema\n');
        }
    }

    /**
     * 📦 Obtém contagem de dependências
     * @returns {string} Número de dependências
     */
    getDependenciesCount() {
        try {
            const dependencies = this.appInfo.dependencies || {};
            return Object.keys(dependencies).length + ' pacotes';
        } catch (error) {
            return 'N/A';
        }
    }

    /**
     * 🔄 Cria box de resultado de conversão
     * @param {string} from - Valor de origem
     * @param {string} to - Valor convertido
     * @param {string} rate - Taxa utilizada
     * @param {string} direction - Direção da conversão
     * @param {string} source - Fonte dos dados
     * @returns {string} Box de resultado
     */
    createConversionResultBox(from, to, rate, direction, source) {
        console.clear();
        try {
            const resultContent = [
                colors.success('✅ CONVERSÃO REALIZADA'),
                colors.muted('─'.repeat(30)),
                '',
                colors.text(`${from}`),
                colors.text('↓'),
                colors.text(`${to}`),
                '',
                colors.success(`🎯 ${direction}`),
                colors.text(`📡 Fonte: ${colors.info(source)}`),
                '',
                colors.muted(`🕒 ${new Date().toLocaleString('pt-BR')}`)
            ].join('\n');

            return this.createBox(resultContent, {
                borderStyle: 'single',
                borderColor: theme.border.success,
                width: 45,
                margin: { top: 2, bottom: 1 }
            });
        } catch (error) {
            logger.error('Erro em createConversionResultBox:', error);
            return colors.text(`✅ ${from} → ${to}\n`);
        }
    }

    /**
     * 👋 Cria box de despedida
     * @returns {string} Box de saída
     */
    createExitBox() {
        console.clear();
        try {
            const exitContent = [
                colors.highlight2('👋 ATÉ LOGO!'),
                colors.muted('─'.repeat(20)),
                '',
                colors.highlight2(`🌱 v${this.appInfo.version}`),
                '',
                colors.text(`${this.appInfo.description}`),
                '',
                colors.text('Feito com ') + colors.danger('💚') + colors.text(' por ') + colors.primary.bold(this.appInfo.author),
                '',
                colors.text('🔗 ') + colors.link(this.appInfo.website),
                colors.text('🔒 ') + colors.link(this.appInfo.website2),
            ].join('\n');

            return this.createBox(exitContent, {
                borderStyle: 'classic',
                borderColor: theme.border.warning,
                width: 40
            });
        } catch (error) {
            logger.error('Erro em createExitBox:', error);
            return colors.text('👋 Obrigado por usar RAVC!\n');
        }
    }

    /**
     * ❌ Cria box de erro
     * @param {string} errorMessage - Mensagem de erro
     * @returns {string} Box de erro
     */
    createErrorBox(errorMessage) {
        try {
            const errorContent = [
                colors.error('❌ ERRO'),
                colors.muted('─'.repeat(25)),
                '',
                colors.text(errorMessage),
                '',
                colors.muted('Recuperação automática...')
            ].join('\n');

            return this.createBox(errorContent, {
                borderStyle: 'single',
                borderColor: theme.border.error,
                width: 50
            });
        } catch (error) {
            logger.error('Erro em createErrorBox:', error);
            return colors.text(`❌ ${errorMessage}\n`);
        }
    }


    /**
     * 🎯 Obtém configuração de direção da variação
     * @param {string} direction - Direção (up/down/stable)
     * @returns {Object} Configuração visual
     */
    getDirectionConfig(direction) {
        const configs = {
            up: {
                symbol: '▲',
                color: colors.success,
                borderColor: theme.border.up
            },
            down: {
                symbol: '▼',
                color: colors.danger,
                borderColor: theme.border.down
            },
            stable: {
                symbol: '*',
                color: colors.muted,
                borderColor: theme.border.info
            }
        };
        return configs[direction] || configs.stable;
    }
}

module.exports = new BoxManager();