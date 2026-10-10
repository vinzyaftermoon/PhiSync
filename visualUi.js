// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Visual UI
//  Author : Vinzy Nightly
//  Version: 1.1
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import chalk from "chalk";
import settings from "./settings.js";

const { botName, version, author } = settings;

// ── Helpers ──
const dim   = (s) => chalk.gray(s);
const cyan  = (s) => chalk.cyan(s);
const green = (s) => chalk.green(s);
const yel   = (s) => chalk.yellow(s);
const red   = (s) => chalk.red(s);
const mag   = (s) => chalk.magenta(s);
const bold  = (s) => chalk.bold(s);
const white = (s) => chalk.white(s);

const LINE2 = "─".repeat(42);

const tag = () =>
  `${cyan(bold(`✦ ${botName}`))} ${dim(`v${version}`)} ${mag("›")}`;

export default {
  // ── Banner startup ──
  banner() {
    const owners = (settings.owner || []).join(", ") || "-";
    console.log("");
    console.log(cyan(bold(`
  ╭────────────────────────────────────────╮
  │                                        │
  │   ██╗      ██████╗ ██╗     ██████╗     │
  │   ██║     ██╔═══██╗██║     ██╔══██╗    │
  │   ██║     ██║   ██║██║     ██████╔╝    │
  │   ██║     ██║   ██║██║     ██╔═══╝     │
  │   ███████╗╚██████╔╝███████╗██║         │
  │   ╚══════╝ ╚═════╝ ╚══════╝╚═╝         │
  │                                        │
  │          ${white(bold("LOLPOP MD"))}  ${dim(`v${version}`)}            │
  │                                        │
  ╰────────────────────────────────────────╯
`)));
    console.log(dim(`  ${LINE2}`));
    console.log(`  ${mag("▸")} Author   ${dim(":")} ${white(author)}`);
    console.log(`  ${mag("▸")} Owner    ${dim(":")} ${white(owners)}`);
    console.log(`  ${mag("▸")} Prefix   ${dim(":")} ${cyan(settings.prefix || ".")}`);
    console.log(`  ${mag("▸")} Mode     ${dim(":")} ${settings.selfMode ? yel("self") : green("public")}`);
    console.log(dim(`  ${LINE2}`));
    console.log("");
  },

  // ── Connection status ──
  connecting() {
    console.log(`${tag()} ${yel("⟳ Connecting to WhatsApp...")}`);
  },

  pairing(code) {
    console.log("");
    console.log(mag(`  ╭${"─".repeat(40)}╮`));
    console.log(mag(`  │`) + bold(cyan(`  PAIRING CODE`.padEnd(40))) + mag(`│`));
    console.log(mag(`  │`) + bold(white(`  ${String(code).padEnd(38)}`)) + mag(`│`));
    console.log(mag(`  ╰${"─".repeat(40)}╯`));
    console.log(`  ${dim("Buka WA → Perangkat Tertaut → Tautkan nomor")}`);
    console.log("");
  },

  connected(botNumber = "") {
    console.log("");
    console.log(`${tag()} ${green(bold("● CONNECTED"))}${botNumber ? dim(`  ${botNumber}`) : ""}`);
    console.log(dim(`  ${LINE2}`));
  },

  disconnected(reason = "") {
    console.log(`${tag()} ${red(bold("○ DISCONNECTED"))}${reason ? dim(`  ${reason}`) : ""}`);
  },

  reconnecting() {
    console.log(`${tag()} ${yel("⟳ Reconnecting in 3s...")}`);
  },

  // ── Generic logs ──
  info(msg) {
    console.log(`${tag()} ${cyan("ℹ")}  ${white(msg)}`);
  },

  success(msg) {
    console.log(`${tag()} ${green("✔")}  ${green(msg)}`);
  },

  warn(msg) {
    console.log(`${tag()} ${yel("⚠")}  ${yel(msg)}`);
  },

  error(msg) {
    console.log(`${tag()} ${red("✖")}  ${red(msg)}`);
  },

  // ── Plugin loader report ──
  pluginReport({ total, success, failed, commands, events, failedList = [] }) {
    console.log("");
    console.log(mag(`  ╭${"─".repeat(40)}╮`));
    console.log(mag(`  │`) + bold(cyan(`  PLUGIN LOADER`.padEnd(40))) + mag(`│`));
    console.log(mag(`  ├${"─".repeat(40)}┤`));
    console.log(mag(`  │`) + `  ${dim("Total file")}    ${white(String(total).padStart(4))}                ${mag("│")}`);
    console.log(mag(`  │`) + `  ${green("Loaded")}        ${green(String(success).padStart(4))}                ${mag("│")}`);
    console.log(mag(`  │`) + `  ${failed > 0 ? red("Failed") : dim("Failed")}        ${failed > 0 ? red(String(failed).padStart(4)) : dim(String(failed).padStart(4))}                ${mag("│")}`);
    console.log(mag(`  │`) + `  ${cyan("Commands")}      ${cyan(String(commands).padStart(4))}                ${mag("│")}`);
    console.log(mag(`  │`) + `  ${yel("Events")}        ${yel(String(events).padStart(4))}                ${mag("│")}`);
    console.log(mag(`  ╰${"─".repeat(40)}╯`));

    if (failedList.length) {
      console.log(red(`  Failed plugins:`));
      for (const f of failedList) {
        console.log(red(`    ✖ ${f.file}`) + dim(` — ${f.error}`));
      }
    }
    console.log("");
  },

  // ── Incoming message ──
  message(sender, text, type) {
    const preview = String(text || "").slice(0, 60).replace(/\n/g, " ");
    console.log(
      `${tag()} ${dim("msg")} ${cyan(sender)} ${dim(`(${type})`)} ${mag("›")} ${white(preview || "(media)")}`
    );
  }
};
