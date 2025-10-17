const logger = require('./utils/logger');
const fs = require('fs');
const path = require('path');

/**
 * 🔄 Sistema de Atualização Contínua
 * @class Updater
 * @description Gerencia atualizações automáticas e logs de variação
 */
class Updater {
    /**
     * 🏗️ Construtor da classe Updater
     * @constructor
     * @param {Object} scraper - Instância do scraper
     * @param {Object} converter - Instância do conversor
     */
    constructor(scraper, converter) {
        this.scraper = scraper;
        this.converter = converter;
        this.isUpdating = false;
        this.updateInterval = null;
        this.history = [];
        this.logsDir = path.join(process.cwd(), 'logs');
        this.previousRate = null;
        this.currentSessionNumber = null;
        this.ensureLogsDirectory();
    }

    /**
     * 📁 Garante que o diretório de logs existe
     * @private
     */
    ensureLogsDirectory() {
        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir, { recursive: true });
        }
    }

    /**
     * 🚀 Inicia atualização contínua
     * @param {number} intervalMinutes - Intervalo em minutos
     * @param {Function} onUpdate - Callback ao atualizar
     */
    startContinuousUpdate(intervalMinutes = 5, onUpdate = null) {
        console.clear();
        if (this.isUpdating) {
            logger.warn('Atualização contínua já está ativa');
            return;
        }

        this.isUpdating = true;
        const intervalMs = intervalMinutes * 60 * 1000;

        // 🆕 Inicia nova sessão
        this.currentSessionNumber = logger.startUpdateSession();

        logger.update(`Iniciando atualização contínua (${intervalMinutes}min) - Sessão #${this.currentSessionNumber}`);

        // ⚡ Executa imediatamente a primeira vez
        this.performUpdate(onUpdate);

        // 📅 Agenda atualizações periódicas
        this.updateInterval = setInterval(() => {
            this.performUpdate(onUpdate);
        }, intervalMs);
    }

    /**
     * ⏹️ Para atualização contínua
     */
    stopContinuousUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        if (this.currentSessionNumber) {
            logger.stopUpdateSession(this.currentSessionNumber);
            this.currentSessionNumber = null;
        }

        this.isUpdating = false;
        logger.stop('Atualização contínua parada');

        // 🧹 Limpa a tela ao finalizar
        console.clear();
    }

    /**
     * 🔄 Executa uma atualização
     * @param {Function} onUpdate - Callback ao completar
     * @returns {Promise<Object|null>} Dados da cotação
     */
    async performUpdate(onUpdate = null) {
        try {
            logger.update('Buscando atualização de cotação...');
            const exchangeData = await this.scraper.getExchangeRate();

            // 📊 Usa os dados exatos do scraper sem recálculos conflitantes
            const variationInfo = this.getVariationFromData(exchangeData);

            // ➕ Adiciona informação de direção aos dados
            exchangeData.variationDirection = variationInfo.direction;
            exchangeData.variationSymbol = variationInfo.symbol;
            exchangeData.rateChange = variationInfo.change;
            exchangeData.previousRate = this.previousRate;

            // 📈 Registra no histórico
            this.recordHistory(exchangeData);

            // 🔄 Atualiza taxa anterior
            this.previousRate = exchangeData.rate;

            // 📝 Registra atualização no sistema de sessão e obtém número
            const updateNumber = logger.logUpdate(this.currentSessionNumber, exchangeData);

            // 💾 Salva log de variação legível em .txt
            this.saveHumanReadableLog(exchangeData, variationInfo, updateNumber);

            logger.success(`Cotação atualizada: ${exchangeData.rate} (${exchangeData.source}) ${variationInfo.symbol} - Sessão #${this.currentSessionNumber} (#${updateNumber})`);

            if (onUpdate && typeof onUpdate === 'function') {
                onUpdate(exchangeData, updateNumber);
            }

            return exchangeData;

        } catch (error) {
            logger.error('Erro na atualização:', error.message);
            return null;
        }
    }

    /**
     * 📈 Obtém variação dos dados do scraper (mesmo método do box)
     * @param {Object} exchangeData - Dados da cotação
     * @returns {Object} Informações da variação
     * @private
     */
    getVariationFromData(exchangeData) {
        // 📊 Usa os dados exatos do scraper para evitar conflitos
        const variation = exchangeData.variation;

        let direction = variation.direction || 'stable';
        let symbol = '*';
        let change = 0;

        // 🔄 Converte para os símbolos corretos
        switch (direction) {
            case 'up':
                symbol = '▲';
                break;
            case 'down':
                symbol = '▼';
                break;
            default:
                symbol = '*';
        }

        // 🔍 Tenta extrair o valor de change do variation.value
        if (variation.value && variation.value !== '0.0000') {
            const changeMatch = variation.value.match(/(-?\d+\.?\d*)/);
            if (changeMatch) {
                change = parseFloat(changeMatch[1]);
            }
        }

        return {
            direction,
            symbol,
            change: change,
            percentChange: variation.percent || '0.00%'
        };
    }

    /**
     * 📊 Registra dados no histórico
     * @param {Object} exchangeData - Dados da cotação
     * @private
     */
    recordHistory(exchangeData) {
        const historyEntry = {
            timestamp: new Date().toISOString(),
            rate: exchangeData.rate,
            source: exchangeData.source,
            variation: exchangeData.variation,
            direction: exchangeData.variationDirection,
            symbol: exchangeData.variationSymbol,
            change: exchangeData.rateChange
        };

        this.history.push(historyEntry);

        // 🗂️ Mantém apenas as últimas 1000 entradas
        if (this.history.length > 1000) {
            this.history = this.history.slice(-1000);
        }
    }

    /**
     * 📝 Salva log legível para humanos em arquivo .TXT com sessão
     * @param {Object} exchangeData - Dados da cotação
     * @param {Object} variationInfo - Informações da variação
     * @param {number} updateNumber - Número da atualização
     * @private
     */
    saveHumanReadableLog(exchangeData, variationInfo, updateNumber) {
        try {
            const date = new Date().toISOString().split('T')[0];
            const logFile = path.join(this.logsDir, `variation-${date}.txt`);

            const now = new Date();
            const dateFormatted = now.toLocaleDateString('pt-BR');
            const timeFormatted = now.toLocaleTimeString('pt-BR');

            // 💰 Formata moedas SEM CORES - texto puro
            const usdFormatted = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(1);

            const brlFormatted = new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(exchangeData.rate);

            // 🎯 Determina símbolo colorido baseado na direção (apenas emoji, sem cores chalk)
            let coloredSymbol;
            if (variationInfo.direction === 'up') {
                coloredSymbol = '🟢▲'; // 🟢 Verde para alta
            } else if (variationInfo.direction === 'down') {
                coloredSymbol = '🔴▼'; // 🔴 Vermelho para baixa
            } else {
                coloredSymbol = '⚪*'; // ⚪ Cinza para estável
            }

            // 📝 Formata a linha de variação exatamente como no box, mas SEM CORES
            let changeText = '';
            if (variationInfo.direction === 'up') {
                changeText = `(+${Math.abs(exchangeData.rateChange).toFixed(4)})`;
            } else if (variationInfo.direction === 'down') {
                changeText = `(-${Math.abs(exchangeData.rateChange).toFixed(4)})`;
            } else {
                changeText = '(=)';
            }

            // 📄 Log formatado SEM CORES - texto puro legível em UTF-8
            const logEntry = [
                `📡 ${exchangeData.source} (Sessão #${this.currentSessionNumber} - Atualização #${updateNumber})`,
                '─'.repeat(45),
                `📅${dateFormatted} 🕒${timeFormatted}`,
                `💵 ${usdFormatted} = ${brlFormatted}`,
                `${coloredSymbol} ${exchangeData.variation.percent} ${changeText}`,
                '' // 📄 Linha em branco para separação
            ].join('\n');

            // 💾 Salva em arquivo .txt com codificação UTF-8
            fs.appendFileSync(logFile, logEntry + '\n', { encoding: 'utf8' });

        } catch (error) {
            // 🛡️ Fallback simples se houver erro
            logger.constructor.debugFallback('Erro ao salvar log legível:', error.message);
        }
    }

    /**
     * 💾 Salva log de variação em JSON (backup) - também em .txt
     * @param {Object} exchangeData - Dados da cotação
     * @private
     */
    saveVariationLog(exchangeData) {
        try {
            const date = new Date().toISOString().split('T')[0];
            const logFile = path.join(this.logsDir, `variation-${date}-data.txt`);

            const logEntry = {
                timestamp: new Date().toISOString(),
                rate: exchangeData.rate,
                source: exchangeData.source,
                variation: exchangeData.variation,
                direction: exchangeData.variationDirection,
                symbol: exchangeData.variationSymbol,
                change: exchangeData.rateChange,
                previousRate: exchangeData.previousRate
            };

            const logLine = JSON.stringify(logEntry, null, 2) + '\n';
            fs.appendFileSync(logFile, logLine, { encoding: 'utf8' });

        } catch (error) {
            logger.constructor.debugFallback('Erro ao salvar log JSON:', error.message);
        }
    }

    /**
     * 📈 Obtém resumo da variação
     * @returns {Object} Resumo das variações
     */
    getVariationSummary() {
        if (this.history.length < 2) {
            return { message: '📊 Histórico insuficiente' };
        }

        const recent = this.history.slice(-10);
        const rates = recent.map(entry => entry.rate);
        const minRate = Math.min(...rates);
        const maxRate = Math.max(...rates);
        const currentRate = rates[rates.length - 1];
        const initialRate = rates[0];

        const totalChange = currentRate - initialRate;
        const totalPercentChange = ((totalChange / initialRate) * 100).toFixed(4);

        return {
            entries: recent.length,
            currentRate,
            initialRate,
            minRate,
            maxRate,
            totalChange: parseFloat(totalChange.toFixed(4)),
            totalPercentChange: `${totalChange > 0 ? '+' : ''}${totalPercentChange}%`
        };
    }

    /**
     * 📄 Obtém histórico formatado
     * @param {number} limit - Limite de entradas
     * @returns {Array} Histórico formatado
     */
    getFormattedHistory(limit = 10) {
        return this.history
            .slice(-limit)
            .map(entry => ({
                time: new Date(entry.timestamp).toLocaleTimeString('pt-BR'),
                rate: entry.rate.toFixed(4),
                source: entry.source,
                direction: entry.direction,
                symbol: entry.symbol,
                change: entry.change
            }));
    }

    /**
     * 🎯 Obtém status atual da variação
     * @returns {Object} Status atual
     */
    getCurrentStatus() {
        if (this.history.length === 0) {
            return { message: '📊 Nenhum dado disponível' };
        }

        const current = this.history[this.history.length - 1];
        const summary = this.getVariationSummary();

        return {
            currentRate: current.rate,
            direction: current.direction,
            symbol: current.symbol,
            change: current.change,
            source: current.source,
            timestamp: current.timestamp,
            summary: summary
        };
    }

    /**
     * 🔍 Verifica se está atualizando
     * @returns {boolean} Status da atualização
     */
    isRunning() {
        return this.isUpdating;
    }

    /**
     * 📊 Obtém informações da sessão atual
     * @returns {Object} Informações da sessão
     */
    getSessionInfo() {
        return {
            sessionNumber: this.currentSessionNumber,
            isUpdating: this.isUpdating,
            stats: logger.getSessionStats()
        };
    }
}

module.exports = Updater;