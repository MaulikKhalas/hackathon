/**
 * Frees TCP port 3000, runs `next dev -p 3000`, opens the browser when ready.
 * Windows: netstat + taskkill. Other: best-effort (lsof).
 */
import { execSync, spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const PORT = 3000;
const URL = `http://localhost:${PORT}`;

function killListenersOn3000() {
  if (process.platform === "win32") {
    try {
      execSync(
        `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${PORT} -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`,
        { stdio: "ignore" },
      );
    } catch {
      /* ignore — fall through to netstat */
    }
    try {
      const out = execSync("netstat -ano", { encoding: "utf8" });
      const pids = new Set();
      for (const line of out.split("\n")) {
        const lower = line.toLowerCase();
        if (!lower.includes("listening") || !line.includes(`:${PORT}`)) continue;
        if (!line.trim().toUpperCase().startsWith("TCP")) continue;
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (/^\d+$/.test(pid)) pids.add(pid);
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* ignore */
    }
    return;
  }

  try {
    execSync(`lsof -ti:${PORT} | xargs kill -9`, {
      stdio: "ignore",
      shell: true,
    });
  } catch {
    try {
      execSync(`fuser -k ${PORT}/tcp`, { stdio: "ignore" });
    } catch {
      /* ignore */
    }
  }
}

function openBrowser() {
  try {
    if (process.platform === "win32") {
      execSync(`start "" "${URL}"`, { shell: true, stdio: "ignore" });
    } else if (process.platform === "darwin") {
      execSync(`open "${URL}"`, { stdio: "ignore" });
    } else {
      execSync(`xdg-open "${URL}"`, { stdio: "ignore" });
    }
  } catch {
    /* ignore */
  }
}

killListenersOn3000();
await new Promise((r) => setTimeout(r, 400));

const nextCli = path.join(root, "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [nextCli, "dev", "-p", String(PORT)], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

let opened = false;
async function openWhenReady() {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 300));
    try {
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort(), 2500);
      const res = await fetch(URL, { signal: ac.signal });
      clearTimeout(t);
      if (res.ok || res.status === 404) {
        if (!opened) {
          opened = true;
          openBrowser();
        }
        return;
      }
    } catch {
      /* still starting */
    }
  }
}

void openWhenReady();

child.on("error", (err) => {
  console.error(err);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) process.exit(1);
  process.exit(code ?? 0);
});
