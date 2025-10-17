const { colors } = require('../config/colors');
const loggerConfig = require('../config/logger.json');
const fs = require('fs');
const path = require('path');

/**
 * 📝 Sistema de Logs Avançado
 * @class Logger
 * @description Gerencia logs com cores, emojis e persistência
 */
class Logger {
    /**
     * 🏗️ Construtor da classe Logger
     * @constructor
     */
    constructor() {
        this.config = loggerConfig;
        this.levels = this.config.levels;
        this.debugEnabled = (process.env.DEBUG === '1' || process.env.DEBUG_SCRAPING === '1');
        this.logsDir = path.join(process.cwd(), 'logs');
        this.sessionFile = path.join(this.logsDir, 'session.json');
        this.ensureLogsDirectory();
        this.currentSession = this.loadSession();
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
     * 💾 Carrega sessão atual ou cria nova
     * @returns {Object} Dados da sessão
     * @private
     */
    loadSession() {
        try {
            if (fs.existsSync(this.sessionFile)) {
                const sessionData = fs.readFileSync(this.sessionFile, 'utf8');
                return JSON.parse(sessionData);
            }
        } catch (error) {
            // 🐛 Se houver erro, cria nova sessão
        }

        // 🆕 Nova sessão
        const newSession = {
            sessionId: this.generateSessionId(),
            startTime: new Date().toISOString(),
            totalUpdates: 0,
            currentUpdateCount: 0,
            sessions: []
        };

        this.saveSession(newSession);
        return newSession;
    }

    /**
     * 🆔 Gera ID único para sessão
     * @returns {string} ID da sessão
     * @private
     */
    generateSessionId() {
        return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 💾 Salva sessão atual
     * @param {Object} session - Dados da sessão
     * @private
     */
    saveSession(session = this.currentSession) {
        try {
            fs.writeFileSync(this.sessionFile, JSON.stringify(session, null, 2), 'utf8');
        } catch (error) {
            // 🔇 Silencioso - não quebra o app se falhar
        }
    }

    /**
     * 🔄 Inicia nova sessão de atualização
     * @returns {number} Número da sessão
     */
    startUpdateSession() {
        const sessionNumber = this.currentSession.sessions.length + 1;
        const newSession = {
            sessionNumber: sessionNumber,
            startTime: new Date().toISOString(),
            updateCount: 0,
            updates: []
        };

        this.currentSession.sessions.push(newSession);
        this.currentSession.totalUpdates = 0;
        this.saveSession();

        this.info(`🔄 Iniciando sessão de atualização #${sessionNumber}`);
        return sessionNumber;
    }

    /**
     * ⏹️ Finaliza sessão de atualização
     * @param {number} sessionNumber - Número da sessão
     */
    stopUpdateSession(sessionNumber) {
        const session = this.currentSession.sessions.find(s => s.sessionNumber === sessionNumber);
        if (session) {
            session.endTime = new Date().toISOString();
            session.duration = new Date(session.endTime) - new Date(session.startTime);
            this.saveSession();
            
            this.info(`🛑 Sessão de atualização #${sessionNumber} finalizada`);
            this.info(`📊 Estatísticas: ${session.updateCount} atualizações em ${this.formatDuration(session.duration)}`);
        }
    }

    /**
     * 📈 Registra nova atualização com contador persistente
     * @param {number} sessionNumber - Número da sessão
     * @param {Object} exchangeData - Dados da cotação
     * @returns {number} Número da atualização
     */
    logUpdate(sessionNumber, exchangeData) {
        const session = this.currentSession.sessions.find(s => s.sessionNumber === sessionNumber);
        if (!session) return 0;

        session.updateCount++;
        this.currentSession.totalUpdates++;
        const updateNumber = session.updateCount;

        const updateRecord = {
            updateNumber: updateNumber,
            timestamp: new Date().toISOString(),
            rate: exchangeData.rate,
            source: exchangeData.source,
            variation: exchangeData.variation,
            direction: exchangeData.variationDirection
        };

        session.updates.push(updateRecord);
        this.saveSession();

        return updateNumber;
    }

    /**
     * ⏱️ Formata duração em formato legível
     * @param {number} milliseconds - Duração em milissegundos
     * @returns {string} Duração formatada
     * @private
     */
    formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    /**
     * 📊 Obtém estatísticas da sessão atual
     * @returns {Object} Estatísticas
     */
    getSessionStats() {
        const currentSession = this.currentSession.sessions[this.currentSession.sessions.length - 1];
        return {
            sessionNumber: currentSession ? currentSession.sessionNumber : 0,
            updateCount: currentSession ? currentSession.updateCount : 0,
            totalSessions: this.currentSession.sessions.length,
            totalUpdates: this.currentSession.totalUpdates
        };
    }

    /**
     * 📄 Registra log com formatação
     * @param {string} level - Nível do log
     * @param {string} message - Mensagem
     * @param {any} data - Dados adicionais
     * @private
     */
    log(level, message, data = null) {
        if (level === this.levels.DEBUG && !this.debugEnabled) {
            return;
        }

        if (!this.config.settings.colorsEnabled) {
            return this.logPlain(level, message, data);
        }

        const timestamp = this.config.settings.showTimestamp ?
            new Date().toLocaleTimeString(this.config.settings.timestampFormat) : '';

        const emoji = this.getEmoji(level);
        const color = this.getColor(level);

        let logMessage = timestamp ?
            `${colors.muted(`[${timestamp}]`)} ${emoji} ${color(message)}` :
            `${emoji} ${color(message)}`;

        if (data && level === this.levels.DEBUG) {
            const dataStr = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
            logMessage += `\n${colors.dim('📋 Dados:')} ${colors.dim(dataStr)}`;
        }

        console.log(logMessage);
    }

    /**
     * 📄 Registra log sem cores
     * @param {string} level - Nível do log
     * @param {string} message - Mensagem
     * @param {any} data - Dados adicionais
     * @private
     */
    logPlain(level, message, data = null) {
        if (level === this.levels.DEBUG && !this.debugEnabled) {
            return;
        }

        const timestamp = this.config.settings.showTimestamp ?
            new Date().toLocaleTimeString(this.config.settings.timestampFormat) : '';

        const emoji = this.getEmoji(level);

        let logMessage = timestamp ?
            `[${timestamp}] ${emoji} ${message}` :
            `${emoji} ${message}`;

        if (data && level === this.levels.DEBUG) {
            const dataStr = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
            logMessage += `\n📋 Dados: ${dataStr}`;
        }

        console.log(logMessage);
    }

    /**
     * 😊 Obtém emoji para nível de log
     * @param {string} level - Nível do log
     * @returns {string} Emoji correspondente
     * @private
     */
    getEmoji(level) {
        return this.config.emojis[level] || '📝';
    }

    /**
     * 🎨 Obtém cor para nível de log
     * @param {string} level - Nível do log
     * @returns {Function} Função de cor chalk
     * @private
     */
    getColor(level) {
        const colorMap = {
            info: colors.info,
            success: colors.success,
            warn: colors.warning,
            error: colors.error,
            debug: colors.muted,
            stop: colors.error,
            update: colors.info,
            start: colors.text,
            ex: colors.highlight2,
        };
        return colorMap[level] || colors.text;
    }

    /**
     * ℹ️ Registra log de informação
     * @param {string} message - Mensagem
     * @param {any} data - Dados adicionais
     */
    info(message, data = null) {
        this.log(this.levels.INFO, message, data);
    }

    /**
     * 🔄 Registra log de execução
     * @param {string} message - Mensagem
     * @param {any} data - Dados adicionais
     */
    ex(message, data = null) {
        this.log(this.levels.EX, message, data);
    }

    /**
     * 🚀 Registra log de início
     * @param {string} message - Mensagem
     * @param {any} data - Dados adicionais
     */
    start(message, data = null) {
        this.log(this.levels.START, message, data);
    }

    /**
     * 📈 Registra log de atualização
     * @param {string} message - Mensagem
     * @param {any} data - Dados adicionais
     */
    update(message, data = null) {
        this.log(this.levels.UPDATE, message, data);
    }

    /**
     * 🛑 Registra log de parada
     * @param {string} message - Mensagem
     * @param {any} data - Dados adicionais
     */
    stop(message, data = null) {
        this.log(this.levels.STOP, message, data);
    }

    /**
     * ✅ Registra log de sucesso
     * @param {string} message - Mensagem
     * @param {any} data - Dados adicionais
     */
    success(message, data = null) {
        this.log(this.levels.SUCCESS, message, data);
    }

    /**
     * ⚠️ Registra log de aviso
     * @param {string} message - Mensagem
     * @param {any} data - Dados adicionais
     */
    warn(message, data = null) {
        this.log(this.levels.WARN, message, data);
    }

    /**
     * ❌ Registra log de erro
     * @param {string} message - Mensagem
     * @param {any} data - Dados adicionais
     */
    error(message, data = null) {
        this.log(this.levels.ERROR, message, data);
    }

    /**
     * 🐛 Registra log de debug
     * @param {string} message - Mensagem
     * @param {any} data - Dados adicionais
     */
    debug(message, data = null) {
        if (this.debugEnabled) {
            this.log(this.levels.DEBUG, message, data);
        }
    }

    /**
     * 🔍 Verifica se debug está ativado
     * @returns {boolean} Status do debug
     */
    isDebugEnabled() {
        return this.debugEnabled;
    }

    /**
     * 📊 Método auxiliar para debug (sem criar dependência circular)
     * @param {string} message - Mensagem de debug
     * @param {any} data - Dados adicionais
     * @static
     */
    static debugFallback(message, data = null) {
        const debugEnabled = (process.env.DEBUG === '1' || process.env.DEBUG_SCRAPING === '1');
        if (!debugEnabled) return;

        const timestamp = new Date().toLocaleTimeString('pt-BR');
        let logMessage = `[${timestamp}] 🐛 ${message}`;

        if (data) {
            const dataStr = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
            logMessage += `\n📋 Dados: ${dataStr}`;
        }

        console.log(logMessage);
    }
}

module.exports = new Logger();