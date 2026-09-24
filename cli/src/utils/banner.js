'use strict';
const chalk = require('chalk');
const boxen = require('boxen');

function printBanner() {
  const logo = `
   ███████╗███████╗███╗   ██╗████████╗██╗███╗   ██╗███████╗██╗     
   ██╔════╝██╔════╝████╗  ██║╚══██╔══╝██║████╗  ██║██╔════╝██║     
   ███████╗█████╗  ██╔██╗ ██║   ██║   ██║██╔██╗ ██║█████╗  ██║     
   ╚════██║██╔══╝  ██║╚██╗██║   ██║   ██║██║╚██╗██║██╔══╝  ██║     
   ███████║███████╗██║ ╚████║   ██║   ██║██║ ╚████║███████╗███████╗
   ╚══════╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝
  `;

  const tagline = chalk.bold.hex('#43f283')('SENTINEL-AGENT') + chalk.dim(' • Autonomous Terminal API Security Scanner & Triage v1.0.0');

  console.log(chalk.hex('#43f283')(logo));
  console.log('  ' + tagline);
  console.log(chalk.dim('  ─────────────────────────────────────────────────────────────────────────────\n'));
}

function printMiniBanner() {
  console.log(
    chalk.bgHex('#12141a').hex('#43f283').bold(' 🛡️  SENTINEL-AGENT ') +
    chalk.dim(' │ Autonomous API Posture & Remediation CLI\n')
  );
}

module.exports = {
  printBanner,
  printMiniBanner,
};
