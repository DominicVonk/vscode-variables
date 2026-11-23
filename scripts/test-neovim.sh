#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ $(uname -m) != x86_64 ]]; then
  echo 'This sandbox currently requires an x86_64 Docker host.' >&2
  exit 1
fi
sandbox_dir=$(mktemp -d)
trap 'rm -rf "$sandbox_dir"' EXIT
mkdir -p "$sandbox_dir/extension/node_modules/vscode-variables" "$sandbox_dir/workspace/folder" "$sandbox_dir/config" "$sandbox_dir/home"
cp scripts/neovim/{index.js,package.json} "$sandbox_dir/extension/"
cp scripts/neovim/init.vim "$sandbox_dir/"
printf 'alpha beta gamma\nsecond line\nhéllo 世界\n' > "$sandbox_dir/workspace/folder/file.test.ts"
git clone --quiet --no-checkout https://github.com/neoclide/coc.nvim.git "$sandbox_dir/coc.nvim"
git -C "$sandbox_dir/coc.nvim" checkout --quiet 24477e09540dc0241cd6ea7ad003691a7bdf863e
curl -fsSL https://github.com/neovim/neovim/releases/download/v0.12.6/nvim-linux-x86_64.tar.gz -o "$sandbox_dir/neovim.tar.gz"
tar -xzf "$sandbox_dir/neovim.tar.gz" -C "$sandbox_dir"
npm pack --pack-destination "$sandbox_dir" >/dev/null
tar -xzf "$sandbox_dir/vscode-variables-$(node -p 'require("./package.json").version').tgz" --strip-components=1 -C "$sandbox_dir/extension/node_modules/vscode-variables"
# No host config, credentials, project mount or network is available to Neovim.
# Disabling AppArmor also permits execution inside nested Docker environments.
docker run --rm --network none --security-opt apparmor=unconfined --user "$(id -u):$(id -g)" -e HOME=/sandbox/home \
  -v "$sandbox_dir:/sandbox" node:22-bookworm sh -c \
  '/sandbox/nvim-linux-x86_64/bin/nvim --version | head -1; node --version; timeout 40 /sandbox/nvim-linux-x86_64/bin/nvim --headless -u /sandbox/init.vim > /sandbox/nvim.log 2>&1' || {
    cat "$sandbox_dir/nvim.log"
    exit 1
  }
node - "$sandbox_dir/result.json" <<'JS'
const assert = require('node:assert/strict');
const result = require(process.argv[2]);
console.log(JSON.stringify(result, null, 2));
assert.equal(result.passed, true, result.error);
JS
