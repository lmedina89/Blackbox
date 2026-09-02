import { getState } from "../core/state.js";
import { HOSTS } from "../data/hosts.js";
import { listDir, normalizePath, getNode, readFile } from "./filesystem.js";
import { scan, connect, disconnect } from "./network.js";
import { discoverClue } from "./clues.js";
import { emit } from "../core/events.js";
import { missionView } from "./missions.js";

const commands = new Map();
const aliases = new Map();

export function registerCommand(def) {
  commands.set(def.name, def);
  for (const alias of def.aliases || []) aliases.set(alias, def.name);
}

export function getPrompt() {
  const state = getState();
  const host = HOSTS[state.terminal.hostId];
  const tail = state.terminal.cwd === "/home" ? "~" : state.terminal.cwd;
  return `${state.terminal.user}@${host.hostname.toLowerCase()}:${tail}$`;
}

export async function executeCommand(raw) {
  const state = getState();
  let commandText = raw.trim();
  if (!commandText) return { lines: [] };

  if (/^cd\.\.$/i.test(commandText)) commandText = "cd ..";

  state.terminal.history.push(commandText);
  if (state.terminal.history.length > 100) state.terminal.history.shift();
  state.terminal.historyIndex = state.terminal.history.length;

  const [rawHead, ...args] = commandText.split(/\s+/);
  const head = rawHead.toLowerCase();
  const name = aliases.get(head) || head;
  const command = commands.get(name);

  if (!command) {
    return { lines: [{ text: `${rawHead}: command not found`, type: "error" }] };
  }

  try {
    return (await command.execute({ state, args })) || { lines: [] };
  } catch (error) {
    return { lines: [{ text: error.message || "Command failed", type: "error" }] };
  }
}

const outputText = value => ({ lines: [{ text: value }] });

registerCommand({
  name: "help",
  execute() {
    return outputText([
      "BLACKBOX COMMAND INDEX", "",
      "SYSTEM",
      "  help              command index",
      "  clear             clear terminal",
      "  whoami            current user",
      "  hostname          current host",
      "  uname [-a]        system information",
      "  ps                process table",
      "  netstat           network connections",
      "  history           command history", "",
      "FILES",
      "  pwd               print working directory",
      "  ls [path]         list directory",
      "  cd <path>         change directory",
      "  cat <file>        read file", "",
      "NETWORK",
      "  scan              discover reachable hosts",
      "  targets           remembered hosts",
      "  connect <host|#>  open simulated remote shell", "",
      "GAME",
      "  missions          active objectives",
      "  exit              close remote/local session"
    ].join("\n"));
  }
});

registerCommand({ name: "clear", execute() { return { clear: true, lines: [] }; } });
registerCommand({ name: "pwd", execute({ state }) { return outputText(state.terminal.cwd); } });
registerCommand({ name: "whoami", execute({ state }) { return outputText(state.terminal.user); } });
registerCommand({ name: "hostname", execute({ state }) { return outputText(HOSTS[state.terminal.hostId].hostname); } });
registerCommand({
  name: "uname",
  execute({ state, args }) {
    const host = HOSTS[state.terminal.hostId];
    return outputText(args.includes("-a") ? `${host.os} ${host.hostname} simnet x86_64 BLACKBOX` : host.os);
  }
});
registerCommand({
  name: "history",
  execute({ state }) {
    return outputText(state.terminal.history.map((item, index) => `${index + 1}  ${item}`).join("\n"));
  }
});
registerCommand({
  name: "ps",
  execute({ state }) {
    const host = HOSTS[state.terminal.hostId];
    return outputText([
      " PID USER       CPU  MEM  COMMAND",
      ...host.processes.map(item => `${String(item.pid).padStart(4)} ${item.user.padEnd(10)} ${item.cpu.padStart(4)} ${item.mem.padStart(4)}  ${item.name}`)
    ].join("\n"));
  }
});
registerCommand({
  name: "netstat",
  execute({ state }) {
    const host = HOSTS[state.terminal.hostId];
    return outputText([
      "Proto Local Address          Remote Address         State",
      ...host.connections.map(item => `${item.proto.padEnd(5)} ${item.local.padEnd(22)} ${item.remote.padEnd(22)} ${item.state}`)
    ].join("\n"));
  }
});
registerCommand({
  name: "ls",
  execute({ state, args }) {
    const path = normalizePath(state.terminal.cwd, args[0] || ".");
    const rows = listDir(state.terminal.hostId, path);
    return outputText(rows.map(item => item.type === "dir" ? `${item.name}/` : item.name).join("  "));
  }
});
registerCommand({
  name: "cd",
  execute({ state, args }) {
    let arg = args[0] || "/home";
    if (arg === "~") arg = "/home";
    const path = normalizePath(state.terminal.cwd, arg);
    const node = getNode(state.terminal.hostId, path);
    if (!node) throw new Error("cd: no such directory");
    if (node.type !== "dir") throw new Error("cd: not a directory");
    state.terminal.cwd = path;
    return { lines: [] };
  }
});
registerCommand({
  name: "cat",
  execute({ state, args }) {
    if (!args[0]) throw new Error("cat: missing file operand");
    const path = normalizePath(state.terminal.cwd, args[0]);
    const body = readFile(state.terminal.hostId, path);
    if (state.terminal.hostId === "archives01" && path === "/archive/employees.db") discoverClue("clue_marcus_carter", "terminal");
    if (state.terminal.hostId === "relay02" && path === "/var/log/relay.log") discoverClue("clue_relay_log", "terminal");
    emit("file:read", { hostId: state.terminal.hostId, path });
    return outputText(body);
  }
});
registerCommand({
  name: "scan",
  execute({ state }) {
    const rows = scan();
    const lines = [
      { text: "BLACKBOX ACTIVE DISCOVERY" },
      { text: "Scanning remembered routes..." },
      { text: "" }
    ];
    for (const host of rows) {
      const index = host.id === "home" ? "-" : String((state.player.discoveredHosts || []).indexOf(host.id));
      lines.push({ text: `${host.address.padEnd(15)} ${host.hostname.padEnd(14)} ${host.services.map(service => `${service.name}:${service.port}`).join(", ")}` });
      if (host.id !== "home") lines.push({ text: `[${index}] USE ${host.hostname}`, type: "action", command: `connect ${index}` });
    }
    lines.push({ text: "" }, { text: "Scan complete." });
    return { lines };
  }
});
registerCommand({
  name: "targets",
  aliases: ["hosts"],
  execute({ state }) {
    const ids = state.player.discoveredHosts || [];
    if (!ids.length) return outputText('No remembered hosts. Investigate the desktop first.');
    const lines = [{ text: "REMEMBERED TARGETS" }, { text: "#   HOSTNAME       ADDRESS" }];
    ids.forEach((id, index) => {
      const host = HOSTS[id];
      if (!host) return;
      lines.push({ text: `${String(index).padEnd(3)} ${host.hostname.padEnd(14)} ${host.address}` });
      lines.push({ text: `[ USE TARGET ${index} ]`, type: "action", command: `connect ${index}` });
    });
    return { lines };
  }
});
registerCommand({
  name: "connect",
  execute({ args }) {
    if (!args[0]) throw new Error("connect: specify hostname, address, or target number");
    const host = connect(args[0]);
    return outputText(`Resolving ${args[0]}...\nRoute found.\nNegotiating session...\nIdentity: ${host.access?.mode || "user"}\nHandshake accepted.\nConnected to ${host.hostname} (${host.address}).`);
  }
});
registerCommand({
  name: "missions",
  aliases: ["jobs"],
  execute() {
    const active = missionView();
    if (!active.length) return outputText("No active jobs.");
    return outputText(active.map(mission => `${mission.title}\n${mission.objectives.map(objective => `${mission.progress[objective.id] ? "[x]" : "[ ]"} ${objective.label}`).join("\n")}`).join("\n\n"));
  }
});
registerCommand({
  name: "exit",
  execute({ state }) {
    if (state.terminal.hostId !== "home") {
      disconnect();
      return outputText("Connection closed by remote host.\nReturned to local BLACKBOX shell.");
    }
    emit("terminal:exit");
    return outputText("Closing BLACKBOX session...");
  }
});
