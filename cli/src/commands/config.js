'use strict';
const chalk = require('chalk');
const Table = require('cli-table3');
const { loadConfig, saveConfig, CONFIG_PATH } = require('../utils/config');

function handleConfigList(options) {
  const config = loadConfig();

  if (options.json) {
    console.log(JSON.stringify(config, null, 2));
    return;
  }

  console.log(chalk.bold(`\nSentinel CLI Configuration (${chalk.dim(CONFIG_PATH)}):\n`));

  const table = new Table({
    head: [chalk.hex('#43f283')('Setting Key'), chalk.hex('#43f283')('Current Value')],
    colWidths: [24, 55],
    style: { border: ['#1f212a'] },
  });

  for (const [k, v] of Object.entries(config)) {
    let displayVal = String(v);
    if ((k.toLowerCase().includes('key') || k.toLowerCase().includes('secret')) && v) {
      displayVal = displayVal.length > 8 ? displayVal.slice(0, 4) + '...' + displayVal.slice(-4) : '••••••••';
    }
    table.push([chalk.cyan(k), chalk.white(displayVal)]);
  }

  console.log(table.toString() + '\n');
}

function handleConfigGet(key, options) {
  const config = loadConfig();
  const val = config[key];

  if (val === undefined) {
    if (options.json) {
      console.log(JSON.stringify({ error: `Key "${key}" not found in config` }));
    } else {
      console.error(chalk.red(`✖ Setting "${key}" is not set.`));
    }
    process.exit(1);
  }

  if (options.json) {
    console.log(JSON.stringify({ [key]: val }));
  } else {
    console.log(String(val));
  }
}

function handleConfigSet(key, value, options) {
  let parsedValue = value;
  if (value.toLowerCase() === 'true') parsedValue = true;
  else if (value.toLowerCase() === 'false') parsedValue = false;
  else if (!isNaN(Number(value)) && value.trim() !== '') parsedValue = Number(value);

  try {
    const updated = saveConfig({ [key]: parsedValue });
    if (options.json) {
      console.log(JSON.stringify({ ok: true, key, value: parsedValue }));
    } else {
      console.log(chalk.green(`✔ Successfully updated ${chalk.bold(key)} to ${chalk.yellow(String(parsedValue))}`));
    }
  } catch (err) {
    if (options.json) {
      console.log(JSON.stringify({ error: err.message }));
    } else {
      console.error(chalk.red(`✖ Failed to write config: ${err.message}`));
    }
    process.exit(1);
  }
}

module.exports = {
  handleConfigList,
  handleConfigGet,
  handleConfigSet,
};
