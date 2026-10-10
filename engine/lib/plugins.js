// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Plugin Helper
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { plugins } from "./pluginLoader.js";

export function getCategories() {
  const cats = new Set();
  for (const plugin of plugins.values()) {
    if (plugin.meta?.category) cats.add(plugin.meta.category);
  }
  return [...cats];
}

export function getCommandsByCategory() {
  const map = {};

  for (const [cmd, plugin] of plugins.entries()) {
    const cat = plugin.meta?.category || "other";
    if (!map[cat]) map[cat] = [];

    if (!map[cat].some((c) => c.name === cmd)) {
      map[cat].push({
        name: cmd,
        description: plugin.meta.description || "",
        group: plugin.meta.group || "📂 LAINNYA",   // ← dukung group
        isOwner: plugin.meta.owner || false
      });
    }
  }

  for (const cat in map) {
    map[cat].sort((a, b) => a.name.localeCompare(b.name));
  }

  return map;
}