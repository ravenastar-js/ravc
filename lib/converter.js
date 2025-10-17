const { colors } = require('./config/colors');

/**
 * 💱 Sistema de Conversão de Moedas
 * @class Converter
 * @description Gerencia conversões USD/BRL com formatação
 */
class Converter {
    /**
     * 🏗️ Construtor da classe Converter
     * @constructor
     */
    constructor() {
        this.decimalPlaces = 4;
    }

    /**
     * 🔄 Converte valor entre moedas
     * @param {number} amount - Valor a converter
     * @param {string} fromCurrency - Moeda de origem
     * @param {string} toCurrency - Moeda de destino
     * @param {number} exchangeRate - Taxa de câmbio
     * @returns {number} Valor convertido
     */
    convert(amount, fromCurrency, toCurrency, exchangeRate) {
        if (fromCurrency === 'USD' && toCurrency === 'BRL') {
            return amount * exchangeRate;
        } else if (fromCurrency === 'BRL' && toCurrency === 'USD') {
            return amount / exchangeRate;
        }
        return amount;
    }

    /**
     * 💵 Formata valor monetário
     * @param {number} amount - Valor a formatar
     * @param {string} currency - Código da moeda
     * @returns {string} Valor formatado
     */
    formatCurrency(amount, currency) {
        const options = currency === 'BRL' ? {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        } : {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        };

        const formatted = new Intl.NumberFormat(
            currency === 'BRL' ? 'pt-BR' : 'en-US',
            options
        ).format(amount);

        return currency === 'BRL' ? colors.brl(formatted) : colors.usd(formatted);
    }

    /**
     * 💵 Formata valor monetário SEM CORES (para logs)
     * @param {number} amount - Valor a formatar
     * @param {string} currency - Código da moeda
     * @returns {string} Valor formatado sem cores
     */
    formatCurrencyNoColor(amount, currency) {
        const options = currency === 'BRL' ? {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        } : {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        };

        return new Intl.NumberFormat(
            currency === 'BRL' ? 'pt-BR' : 'en-US',
            options
        ).format(amount);
    }

    /**
     * 📊 Formata taxa de câmbio
     * @param {number} rate - Taxa a formatar
     * @returns {string} Taxa formatada
     */
    formatRate(rate) {
        return rate.toFixed(this.decimalPlaces);
    }

    /**
     * ✅ Valida valor de entrada
     * @param {string} input - Entrada do usuário
     * @returns {Object} Resultado da validação
     */
    validateAmount(input) {
        const value = parseFloat(input.replace(',', '.'));
        return {
            isValid: !isNaN(value) && value > 0,
            value: value,
            error: !isNaN(value) && value > 0 ? null : '❌ Digite um número válido maior que zero'
        };
    }

    /**
     * 📄 Formata dados para JSON
     * @param {Object} exchangeData - Dados da cotação
     * @param {Object} conversion - Dados da conversão
     * @returns {Object} Dados formatados para JSON
     */
    toJSON(exchangeData, conversion = null) {
        const baseData = {
            timestamp: new Date().toISOString(),
            rate: exchangeData.rate,
            source: exchangeData.source,
            variation: exchangeData.variation
        };

        if (conversion) {
            baseData.conversion = conversion;
        }

        return baseData;
    }

    /**
     * 📊 Formata informação de variação com direção
     * @param {Object} variationData - Dados da variação
     * @returns {string} Variação formatada
     */
    formatVariation(variationData) {
        const { direction, change, percentChange } = variationData;

        let symbol, color;

        switch (direction) {
            case 'up':
                symbol = '▲';
                color = colors.up;
                break;
            case 'down':
                symbol = '▼';
                color = colors.down;
                break;
            default:
                symbol = '*';
                color = colors.stable;
        }

        const changeText = change !== 0 ? ` (${change > 0 ? '+' : ''}${change.toFixed(4)})` : '';
        return color(`${symbol} ${percentChange}${changeText}`);
    }

    /**
     * 🎯 Obtém cor baseada na direção
     * @param {string} direction - Direção da variação
     * @returns {Function} Função de cor chalk
     */
    getDirectionColor(direction) {
        switch (direction) {
            case 'up': return colors.up;
            case 'down': return colors.down;
            default: return colors.stable;
        }
    }

    /**
     * 🔄 Obtém símbolo baseado na direção
     * @param {string} direction - Direção da variação
     * @returns {string} Símbolo
     */
    getDirectionSymbol(direction) {
        switch (direction) {
            case 'up': return '▲';
            case 'down': return '▼';
            default: return '*';
        }
    }
}

module.exports = new Converter();