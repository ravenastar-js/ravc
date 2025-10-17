const scrapingConfig = require('./config/scraping.json');
const logger = require('./utils/logger');

/**
 * 🕷️ Sistema de Scraping Inteligente com Suporte Termux
 * @class Scraper
 * @description Busca cotações com fallback automático entre fontes
 */
class Scraper {
    /**
     * 🏗️ Construtor da classe Scraper
     * @constructor
     */
    constructor() {
        this.config = scrapingConfig;
        this.sources = this.config.sources.filter(source => source.enabled);
        this.fallbackRate = this.config.fallbackRate;
        this.maxRetries = this.config.maxRetries;
        this.isTermux = process.platform === 'android';
        
        if (this.isTermux) {
            logger.warn('📱 Modo Termux detectado - usando fontes API');
        }
    }

    /**
     * 🌐 Obtém cotação com fallback inteligente
     * @returns {Promise<Object>} Dados da cotação
     */
    async getExchangeRate() {
        // 📱 No Termux, prioriza APIs
        if (this.isTermux) {
            return await this.getExchangeRateTermux();
        }

        // 🖥️ No desktop, comportamento normal
        return await this.getExchangeRateDesktop();
    }

    /**
     * 📱 Estratégia para Termux (sem Playwright)
     * @returns {Promise<Object>} Dados da cotação
     * @private
     */
    async getExchangeRateTermux() {
        logger.info('📱 Modo Termux: usando fontes API...');
        
        // 🎯 Tenta Banco Central primeiro
        const bacenSource = this.sources.find(s => s.name === 'Banco Central API' && s.enabled);
        if (bacenSource) {
            const result = await this.trySource(bacenSource);
            if (result) {
                return result;
            }
        }

        // 🛡️ Tenta API Awesome como fallback
        const awesomeSource = this.sources.find(s => s.name === 'API Pública (Awesome)' && s.enabled);
        if (awesomeSource) {
            logger.warn('📱 Banco Central falhou, tentando API Awesome...');
            const result = await this.trySource(awesomeSource);
            if (result) {
                return result;
            }
        }

        logger.error('📱 Todas as APIs falharam, usando fallback estático');
        return this.createFallbackData();
    }

    /**
     * 🖥️ Estratégia para Desktop (com Playwright)
     * @returns {Promise<Object>} Dados da cotação
     * @private
     */
    async getExchangeRateDesktop() {
        let primaryResult = null;
        let fallbackResult = null;

        // 🎯 Tenta Google Finance primeiro
        const googleSource = this.sources.find(s => s.name === 'Google Finance' && s.enabled);
        if (googleSource) {
            logger.info(`🔍 Buscando do Google Finance...`);
            primaryResult = await this.trySource(googleSource);
        }

        if (primaryResult) {
            logger.success(`✅ Cotação obtida do Google Finance`);
            return primaryResult;
        }

        // 🛡️ Tenta Banco Central como fallback
        const bacenSource = this.sources.find(s => s.name === 'Banco Central API' && s.enabled);
        if (bacenSource) {
            logger.warn(`🔄 Fallback para Banco Central...`);
            fallbackResult = await this.trySource(bacenSource);
        }

        if (fallbackResult) {
            logger.success(`✅ Cotação obtida do Banco Central`);
            return fallbackResult;
        }

        // 💥 Último recurso: API Awesome
        const awesomeSource = this.sources.find(s => s.name === 'API Pública (Awesome)' && s.enabled);
        if (awesomeSource) {
            logger.warn(`🔄 Último recurso: API Awesome...`);
            const awesomeResult = await this.trySource(awesomeSource);
            if (awesomeResult) {
                return awesomeResult;
            }
        }

        logger.error('❌ Todas as fontes falharam, usando fallback estático');
        return this.createFallbackData();
    }

    /**
     * 🔄 Tenta obter dados de uma fonte específica
     * @param {Object} source - Fonte de dados
     * @param {number} retryCount - Contador de tentativas
     * @returns {Promise<Object|null>} Dados da cotação ou null
     */
    async trySource(source, retryCount = 0) {
        try {
            logger.debug(`🔄 Tentando ${source.name} (tentativa ${retryCount + 1})`);

            // 📱 No Termux, ignora Google Finance (web scraping)
            if (this.isTermux && source.type === 'web') {
                logger.debug(`📱 Ignorando ${source.name} no Termux`);
                return null;
            }

            switch (source.name) {
                case 'Google Finance':
                    return await this.scrapeGoogleFinance(source);
                case 'Banco Central API':
                    return await this.scrapeBancoCentralAPI(source);
                case 'API Pública (Awesome)':
                    return await this.scrapeAwesomeAPI(source);
                default:
                    return null;
            }
        } catch (error) {
            if (retryCount < this.maxRetries) {
                logger.warn(`🔄 Tentativa ${retryCount + 1} falhou, retentando...`);
                await this.delay(this.config.retryDelay);
                return this.trySource(source, retryCount + 1);
            }
            logger.error(`❌ Fonte ${source.name} falhou após ${this.maxRetries} tentativas`);
            return null;
        }
    }

    /**
     * 🌐 Scraping de fonte web (Google Finance) - apenas desktop
     * @param {Object} source - Configuração da fonte
     * @returns {Promise<Object|null>} Dados da cotação
     */
    async scrapeGoogleFinance(source) {
        // 📱 Bloqueia web scraping no Termux
        if (this.isTermux) {
            throw new Error('Web scraping não suportado no Termux');
        }

        let browser;
        try {
            const { chromium } = require('playwright');
            
            browser = await chromium.launch(this.config.browser);
            const page = await browser.newPage();

            await page.setDefaultTimeout(source.timeout);
            logger.debug(`🌐 Acessando: ${source.url}`);

            await page.goto(source.url, {
                waitUntil: 'domcontentloaded',
                timeout: source.timeout
            });

            await page.waitForSelector(source.selectors.price, { timeout: 10000 });
            logger.debug('✅ Elemento do preço carregado (Google)');

            await page.waitForTimeout(2000);

            const priceText = await page.$eval(source.selectors.price, el => el.textContent.trim());
            logger.debug(`💰 Texto do preço: "${priceText}"`);

            const rate = this.parseRate(priceText);
            if (!this.isValidRate(rate)) {
                throw new Error(`❌ Taxa inválida: ${rate}`);
            }

            const variation = await this.getVariationInfo(page, source);

            // 🛡️ Garante que todos os campos estejam presentes
            if (!variation.percent) variation.percent = '0.00%';
            if (!variation.value) variation.value = '0.0000';
            if (!variation.direction) variation.direction = 'stable';
            if (!variation.timestamp) variation.timestamp = new Date().toLocaleString('pt-BR');

            return {
                rate: rate,
                variation: variation,
                source: source.name,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            logger.error(`❌ Erro no Google Finance: ${error.message}`);
            return null;
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    /**
     * 🏛️ Scraping da API do Banco Central
     * @param {Object} source - Configuração da fonte
     * @returns {Promise<Object>} Dados da cotação
     */
    async scrapeBancoCentralAPI(source) {
        try {
            const today = new Date();
            const dateStr = today.toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric'
            }).replace(/\//g, '-');

            const apiUrl = `${source.url}?@dataCotacao='${dateStr}'&$top=1&$format=json`;
            logger.debug(`🌐 Acessando API BC: ${apiUrl}`);

            const response = await fetch(apiUrl, {
                headers: {
                    'User-Agent': this.config.userAgent,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`❌ HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.value || data.value.length === 0) {
                // 🔄 Tenta dia anterior
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric'
                }).replace(/\//g, '-');

                const yesterdayUrl = `${source.url}?@dataCotacao='${yesterdayStr}'&$top=1&$format=json`;
                const yesterdayResponse = await fetch(yesterdayUrl);

                if (!yesterdayResponse.ok) {
                    throw new Error('❌ Nenhum dado para hoje ou ontem');
                }

                const yesterdayData = await yesterdayResponse.json();
                if (!yesterdayData.value || yesterdayData.value.length === 0) {
                    throw new Error('❌ Nenhum dado retornado');
                }

                data.value = yesterdayData.value;
            }

            const cotacao = data.value[0];
            const rate = cotacao.cotacaoVenda;
            logger.debug(`💰 Taxa API BC: ${rate}`);

            if (!this.isValidRate(rate)) {
                throw new Error(`❌ Taxa inválida: ${rate}`);
            }

            return {
                rate: rate,
                variation: {
                    percent: '0.00%',
                    value: '0.0000',
                    direction: 'stable',
                    timestamp: new Date().toLocaleString('pt-BR')
                },
                source: source.name,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            logger.error(`❌ Erro na API BC: ${error.message}`);
            return null;
        }
    }

    /**
     * 🌐 Scraping da API Awesome
     * @param {Object} source - Configuração da fonte
     * @returns {Promise<Object>} Dados da cotação
     */
    async scrapeAwesomeAPI(source) {
        try {
            logger.debug(`🌐 Acessando API Awesome: ${source.url}`);

            const response = await fetch(source.url, {
                headers: {
                    'User-Agent': 'RAVC-CLI/1.0.0',
                    'Accept': 'application/json'
                },
                timeout: source.timeout
            });

            if (!response.ok) {
                throw new Error(`❌ HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const rate = parseFloat(data.USDBRL.bid);
            
            logger.debug(`💰 Taxa API Awesome: ${rate}`);

            if (!this.isValidRate(rate)) {
                throw new Error(`❌ Taxa inválida: ${rate}`);
            }

            return {
                rate: rate,
                variation: {
                    percent: '0.00%',
                    value: '0.0000',
                    direction: 'stable',
                    timestamp: new Date().toLocaleString('pt-BR')
                },
                source: source.name,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            logger.error(`❌ Erro na API Awesome: ${error.message}`);
            return null;
        }
    }

    // 🔧 Métodos auxiliares (mantidos da versão original)

    /**
     * 📊 Obtém informações de variação
     * @param {Object} page - Página do Playwright
     * @param {Object} source - Configuração da fonte
     * @returns {Promise<Object>} Dados de variação
     * @private
     */
    async getVariationInfo(page, source) {
        const variation = {
            percent: '0.00%',
            value: '0.0000',
            direction: 'stable',
            timestamp: new Date().toLocaleString('pt-BR')
        };

        try {
            const mainContainer = await page.$('.rPF6Lc');
            if (!mainContainer) {
                logger.debug('📦 Container principal não encontrado');
                return variation;
            }

            logger.debug('✅ Container principal encontrado');

            const percentResult = await this.findPercentage(mainContainer);
            if (percentResult) {
                variation.percent = percentResult;
                logger.debug(`📈 Porcentagem: "${variation.percent}"`);
            }

            const valueResult = await this.findValue(mainContainer);
            if (valueResult) {
                variation.value = valueResult;
                logger.debug(`💰 Valor: "${variation.value}"`);
            }

            variation.direction = await this.determineDirection(mainContainer, variation);
            logger.debug(`🎯 Direção: ${variation.direction}`);

        } catch (error) {
            logger.debug(`⚠️ Erro ao obter variação: ${error.message}`);
        }

        return variation;
    }

    /**
     * 🔍 Encontra porcentagem de variação
     * @param {Object} container - Container do Playwright
     * @returns {Promise<string>} Porcentagem formatada
     * @private
     */
    async findPercentage(container) {
        try {
            const element = await container.$('.JwB6zf');
            if (element) {
                let text = await element.textContent();
                logger.debug(`📊 Texto do JwB6zf: "${text}"`);
                return text.replace(/[+−]/g, '').replace(',', '.');
            }
        } catch (e) {
            logger.debug('❌ Falha no JwB6zf');
        }
        return '0.00%';
    }

    /**
     * 🔍 Encontra valor de variação
     * @param {Object} container - Container do Playwright
     * @returns {Promise<string>} Valor formatado
     * @private
     */
    async findValue(container) {
        const valueSelectors = [
            '.P2Luy.Ebnabc.ZYVHBb',
            '.ZYVHBb',
            '.P2Luy',
            '.Ebnabc'
        ];

        for (const selector of valueSelectors) {
            try {
                const element = await container.$(selector);
                if (element) {
                    const text = await element.textContent();
                    logger.debug(`🔍 Tentando seletor "${selector}": "${text}"`);

                    const match = text.match(/[-−+]?\d+[,.]?\d*/);
                    if (match) {
                        return match[0].replace('−', '-').replace(',', '.');
                    }
                }
            } catch (error) {
                // 🔄 Continuar para o próximo seletor
            }
        }

        return '0.0000';
    }

    /**
     * 🎯 Determina direção da variação
     * @param {Object} container - Container do Playwright
     * @param {Object} variation - Dados de variação
     * @returns {Promise<string>} Direção (up/down/stable)
     * @private
     */
    async determineDirection(container, variation) {
        if (variation.value && variation.value !== '0.0000') {
            logger.debug(`📊 Analisando valor: "${variation.value}"`);
            return variation.value.startsWith('-') ? 'down' : 'up';
        }

        try {
            const element = await container.$('[jsname="Fe7oBc"]');
            if (element) {
                const ariaLabel = await element.getAttribute('aria-label');
                logger.debug(`🏷️ aria-label: "${ariaLabel}"`);

                if (ariaLabel) {
                    if (ariaLabel.includes('Diminuiu') || ariaLabel.includes('down') || ariaLabel.includes('fall')) {
                        return 'down';
                    } else if (ariaLabel.includes('Aumentou') || ariaLabel.includes('up') || ariaLabel.includes('rise')) {
                        return 'up';
                    }
                }
            }
        } catch (error) {
            logger.debug('⚠️ Não foi possível determinar direção pelo aria-label');
        }

        return 'stable';
    }

    /**
     * 🔄 Parseia texto da taxa
     * @param {string} rateText - Texto da taxa
     * @returns {number} Taxa parseada
     * @private
     */
    parseRate(rateText) {
        const strategies = [
            () => {
                const match = rateText.match(/(\d+),(\d+)/);
                if (match) {
                    return parseFloat(`${match[1]}.${match[2]}`);
                }
                return null;
            },
            () => {
                const clean = rateText.replace(/[^\d,.]/g, '');
                if (clean.includes(',')) {
                    return parseFloat(clean.replace(',', '.'));
                }
                return parseFloat(clean);
            }
        ];

        for (const strategy of strategies) {
            const result = strategy();
            if (result && !isNaN(result)) {
                return result;
            }
        }

        throw new Error(`❌ Não foi possível parsear: ${rateText}`);
    }

    /**
     * ✅ Valida taxa obtida
     * @param {number} rate - Taxa a validar
     * @returns {boolean} Se a taxa é válida
     * @private
     */
    isValidRate(rate) {
        return rate && !isNaN(rate) && rate > 1 && rate < 10;
    }

    /**
     * 🛡️ Cria dados de fallback
     * @returns {Object} Dados de fallback
     * @private
     */
    createFallbackData() {
        return {
            rate: this.fallbackRate,
            variation: {
                percent: '0.00%',
                value: '0.0000',
                direction: 'stable',
                timestamp: new Date().toLocaleString('pt-BR')
            },
            source: 'Fallback',
            timestamp: new Date().toISOString()
        };
    }

    /**
     * ⏳ Delay entre tentativas
     * @param {number} ms - Milissegundos para esperar
     * @returns {Promise} Promise resolvida após delay
     * @private
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new Scraper();