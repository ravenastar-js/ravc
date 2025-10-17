const { readFileSync } = require('fs');
const { join } = require('path');
const appConfig = require('../config/app.json');

/**
 * 📦 Gerenciador de Informações do Pacote
 * @class PackageInfo
 * @description Centraliza dados do package.json e app.json
 */
class PackageInfo {
    /**
     * 🏗️ Construtor da classe PackageInfo
     * @constructor
     */
    constructor() {
        this.packageData = this.loadPackageInfo();
        this.appData = appConfig;
    }

    /**
     * 📄 Carrega informações do package.json
     * @returns {Object} Dados do package.json
     * @private
     */
    loadPackageInfo() {
        try {
            const packagePath = join(__dirname, '..', '..', 'package.json');
            const packageJson = readFileSync(packagePath, 'utf8');
            return JSON.parse(packageJson);
        } catch (error) {
            console.error('❌ Erro ao carregar package.json:', error.message);
            return this.getFallbackInfo();
        }
    }

    /**
     * 🛡️ Cria informações de fallback
     * @returns {Object} Dados de fallback
     * @private
     */
    getFallbackInfo() {
        return {
            name: 'RAVC',
            version: '1.0.0',
            description: 'CLI Profissional para Conversão de Moedas USD/BRL',
            author: this.appData.author,
            license: 'MIT'
        };
    }

    /**
     * 🏷️ Obtém nome do aplicativo
     * @returns {string} Nome do app
     */
    get name() {
        return this.packageData.name || 'RAVC';
    }

    /**
     * 🔢 Obtém versão do aplicativo
     * @returns {string} Versão
     */
    get version() {
        return this.packageData.version || '1.0.0';
    }

    /**
     * 📝 Obtém descrição do aplicativo
     * @returns {string} Descrição
     */
    get description() {
        return this.packageData.description || 'CLI Profissional para Conversão de Moedas USD/BRL';
    }

    /**
     * 👤 Obtém autor do aplicativo
     * @returns {string} Autor
     */
    get author() {
        return this.packageData.author || this.appData.author;
    }

    /**
     * 📜 Obtém licença do aplicativo
     * @returns {string} Licença
     */
    get license() {
        return this.packageData.license || 'MIT';
    }

    /**
     * 🌐 Obtém página inicial
     * @returns {string} URL da homepage
     */
    get homepage() {
        return this.packageData.homepage || this.appData.website;
    }

    /**
     * 📚 Obtém repositório
     * @returns {Object} Dados do repositório
     */
    get repository() {
        return this.packageData.repository || null;
    }

    /**
     * 📦 Obtém dependências
     * @returns {Object} Dependências
     */
    get dependencies() {
        return this.packageData.dependencies || null;
    }

    /**
     * 🐛 Obtém URL de issues
     * @returns {Object} URL de bugs
     */
    get bugs() {
        return this.packageData.bugs || null;
    }

    /**
     * 🔑 Obtém palavras-chave
     * @returns {Array} Array de palavras-chave
     */
    get keywords() {
        return this.packageData.keywords || ['currency', 'converter', 'cli', 'usd', 'brl'];
    }

    /**
     * 📊 Retorna todas as informações consolidadas
     * @returns {Object} Todas as informações do app
     */
    get allInfo() {
        return {
            // 📦 Do package.json
            name: this.name,
            version: this.version,
            description: this.description,
            author: this.author,
            license: this.license,
            homepage: this.homepage,
            repository: this.repository,
            bugs: this.bugs,
            keywords: this.keywords,
            dependencies: this.dependencies,
            
            // 🌐 Do app.json
            website: this.appData.website,
            website2: this.appData.website2
        };
    }
}

module.exports = new PackageInfo();