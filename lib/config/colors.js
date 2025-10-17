const chalk = require('chalk');

/**
 * 🎨 Sistema de cores para RAVC
 * Cores vibrantes e acessíveis para melhor experiência visual
 */
const colors = {
    primary: chalk.hex("#06D6A0"),
    success: chalk.hex("#57f287"),
    action: chalk.hex("#4ECDC4"),
    highlight: chalk.hex("#FFD166"),
    highlight2: chalk.hex("#F8E789"),
    warning: chalk.hex("#FF9E64"),
    info: chalk.hex("#67d1f5ff"),
    link: chalk.hex("#8AD4FF").underline,
    accent: chalk.hex("#4CC9F0"),
    danger: chalk.hex("#FF9999"),
    error: chalk.hex("#F72585"),
    title: chalk.hex("#E9ECEF").bold,
    subtitle: chalk.hex("#CED4DA"),
    text: chalk.hex("#E9ECEF"),
    muted: chalk.hex("#6C757D"),
    dim: chalk.hex("#495057"),
    usd: chalk.hex("#5bdf7a"),
    brl: chalk.hex("#dfd65b"),
    rate: chalk.hex("#20C997"),
    up: chalk.hex("#57f287"),
    down: chalk.hex("#FF9999"),
    stable: chalk.hex("#6C757D")
};

/**
 * 🎭 Configurações de tema para componentes visuais
 */
const theme = {
    background: '#1a1a1a',
    border: {
        primary: '#57f287',
        success: '#06D6A0',
        warning: '#FFD166',
        warning2: '#F8E789',
        error: '#FF9999',
        info: '#118AB2',
        info2:'#67d1f5',
        up: '#57f287',
        down: '#FF9999'
    },
    padding: 1,
    margin: 1
};

module.exports = { colors, theme };