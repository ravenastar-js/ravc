

<div align="center">

<a href="https://www.npmjs.com/package/ravc" target="_blank"><img src="https://img.shields.io/badge/-ravc-c40404?style=flat-square&labelColor=c40404&logo=npm&logoColor=white&link=https://www.npmjs.com/package/ravc" height="40" /></a>  
 <a href="https://www.npmjs.com/package/ravc" target="_blank"><img alt="NPM Version" src="https://img.shields.io/npm/v/ravc?style=flat-square&logo=npm&labelColor=c40404&color=c40404" height="40" ></a>
</div>

---

<div align="center">

## 🚀 RAVC

### ⚙️ CLI/NPM para Conversão de Moedas USD/BRL & Cotação em tempo real.

[![NPM Version](https://img.shields.io/npm/v/ravc?style=for-the-badge&logo=npm&labelColor=2d7445&color=2d7445)](https://www.npmjs.com/package/ravc)
[![Node.js](https://img.shields.io/badge/Node.js-14.0+-green?style=for-the-badge&logo=nodedotjs&color=2d7445)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge&logo=opensourceinitiative&color=2d7445)](LICENSE)

*Biblioteca NPM + CLI*

</div>

![ravc](media/ravc.png)

---

## 📋 Visão Geral

O **RAVC** é uma ferramenta de linha de comando (CLI) e NPM que oferece conversão de moedas e monitoramento em tempo real das cotações USD/BRL, com interface interativa e visualmente atrativa.

## 📦 Instalação Rápida

<details>
<summary>📥 Como instalar o NodeJS?</summary>

- [COMO INSTALAR NODE JS NO WINDOWS?](https://youtu.be/-jft_9PlffQ)

![ravc](media/ravc.gif)

</details>

```bash
# Instalar globalmente
npm i -g ravc         # ✅ Recomendado
npm install -g ravc   # ✅ Completo
```

## 🗑️ DESINSTALAR GLOBALMENTE

```bash
npm un -g ravc        # ✅ Recomendado  
npm uninstall -g ravc # ✅ Completo
npm remove -g ravc    # ✅ Alternativo
```

## 💻 Como Usar

### 🎮 Modo Interativo (Recomendado)

```bash
ravc
```
*Menu completo com todas as funcionalidades*

### ⚡ Comandos Diretos

```bash
# Google Finance direto
ravc google
ravc -g

# Banco Central direto  
ravc bacen
ravc -b

# Modo atualização contínua
ravc update
ravc -u

# Ajuda
ravc help
ravc -h
```

### 🔄 Modo Atualização Contínua

```bash
ravc update
```
*Atualiza automaticamente a cada minuto com logs em tempo real*

## 🎯 Funcionalidades

### 💱 Conversão de Moedas
- USD → BRL e BRL → USD
- Formatação monetária adequada
- Validação de entrada

### 📈 Monitoramento
- Variações em tempo real
- Direção (alta/baixa/estável)
- Percentuais de mudança
- Timestamps precisos

### 📊 Logs e Histórico
- Logs em arquivo .txt legíveis
- Histórico de sessões
- Estatísticas de variação
- Backups em JSON

## 🔧 Desenvolvimento

### 📦 Dependências Principais
- `playwright` - Web scraping
- `inquirer` - Interface interativa  
- `boxen` - Boxes estilizados
- `chalk` - Cores no terminal
- `figlet` - Banner ASCII


## 🐛 Solução de Problemas

### 🔍 Debug Mode
```bash
# Ativar logs detalhados
DEBUG=1 ravc

# Debug específico do scraping  
DEBUG_SCRAPING=1 ravc
```

### ❌ Problemas Comuns

**Erro de permissão no NPM:**
```bash
# Linux/Mac
sudo npm install -g ravc

# Windows (Admin)
npm install -g ravc
```

**Playwright não instalado:**
```bash
npx playwright install
```


## 🏗️ Estrutura do Projeto

```
ravc/ 🌟
├── 📁 bin/
│   └── 🚀 cli.js
├── 📁 lib/
│   ├── 📁 config/
│   │   ├── ⚙️ app.json
│   │   ├── 🎨 colors.js
│   │   ├── 🔧 logger.json
│   │   ├── 🕷️ scraping.json
│   │   └── 🎭 ui.json
│   ├── 📁 utils/
│   │   ├── 📦 box.js
│   │   ├── 📝 logger.js
│   │   └── 📦 packageInfo.js
│   ├── 💱 converter.js
│   ├── 🏠 index.js
│   ├── 🕷️ scraper.js
│   ├── 🎨 ui.js
│   └── 🔄 updater.js
├── 📄 package.json
└── 📖 README.md
```

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

---

<div align="center">

**✨ Feito com 💚 por [RavenaStar](https://ravenastar.link)**

[⭐ Dê uma estrela no GitHub!](https://github.com/ravenastar-js/ravc)

</div>

---

## 🌟 Star History

<a href="https://www.star-history.com/?repos=ravenastar-js%2Fravc&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=ravenastar-js/ravc&type=date&theme=dark&legend=top-left&sealed_token=OdAEgVIcuM9T5E8kXzZmWN6PqX0oRDP4oXAr31EZNDC1sDHP1ycEJ0XdynH7ST5QhkCmozctstD-rRpDK1bAPkAxM8d5xhuYixPAEAyYfMDAHEMndmP8nQ" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=ravenastar-js/ravc&type=date&legend=top-left&sealed_token=OdAEgVIcuM9T5E8kXzZmWN6PqX0oRDP4oXAr31EZNDC1sDHP1ycEJ0XdynH7ST5QhkCmozctstD-rRpDK1bAPkAxM8d5xhuYixPAEAyYfMDAHEMndmP8nQ" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=ravenastar-js/ravc&type=date&legend=top-left&sealed_token=OdAEgVIcuM9T5E8kXzZmWN6PqX0oRDP4oXAr31EZNDC1sDHP1ycEJ0XdynH7ST5QhkCmozctstD-rRpDK1bAPkAxM8d5xhuYixPAEAyYfMDAHEMndmP8nQ" />
 </picture>
</a>
