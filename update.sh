#!/usr/bin/env bash
# 从指定的远端分支安全更新本仓库。
# 用法：./update.sh [分支名] [远端名]
# 默认：./update.sh arena/6f3888bd-fyx-homepage origin

set -Eeuo pipefail

readonly DEFAULT_BRANCH="arena/6f3888bd-fyx-homepage"
readonly DEFAULT_REMOTE="origin"

usage() {
  cat <<EOF
用法：$(basename "$0") [分支名] [远端名]

从指定远端分支拉取更新，并且只允许快进（不会自动合并或覆盖本地改动）。

参数：
  分支名    默认：${DEFAULT_BRANCH}
  远端名    默认：${DEFAULT_REMOTE}

也可以通过环境变量 UPDATE_BRANCH、UPDATE_REMOTE 设置默认值；
命令行参数的优先级更高。

示例：
  ./update.sh
  ./update.sh main
  ./update.sh main upstream
  UPDATE_BRANCH=main ./update.sh
EOF
}

if [[ ${1:-} == "-h" || ${1:-} == "--help" ]]; then
  usage
  exit 0
fi

if (( $# > 2 )); then
  usage >&2
  exit 64
fi

branch="${1:-${UPDATE_BRANCH:-$DEFAULT_BRANCH}}"
remote="${2:-${UPDATE_REMOTE:-$DEFAULT_REMOTE}}"

if ! command -v git >/dev/null 2>&1; then
  echo "错误：未找到 git，请先安装 Git。" >&2
  exit 127
fi

# 无论从哪个目录调用，都在 update.sh 所在仓库内执行。
script_dir="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
if ! repo_root="$(git -C "$script_dir" rev-parse --show-toplevel 2>/dev/null)"; then
  echo "错误：update.sh 不在 Git 仓库中。" >&2
  exit 1
fi
cd "$repo_root"

if ! git check-ref-format --branch "$branch" >/dev/null 2>&1; then
  echo "错误：无效的分支名：$branch" >&2
  exit 64
fi

if ! git remote get-url "$remote" >/dev/null 2>&1; then
  echo "错误：远端不存在：$remote" >&2
  echo "当前远端：" >&2
  git remote -v >&2 || true
  exit 2
fi

# 切换分支或拉取前先保护本地受跟踪文件；未跟踪的上传文件不会被误删。
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "错误：存在未提交的受跟踪文件改动，已停止更新以避免数据丢失。" >&2
  echo "请先提交或暂存这些改动，再重新运行：" >&2
  git status --short --untracked-files=no >&2
  exit 3
fi

printf '正在检查 %s/%s…\n' "$remote" "$branch"
if ! git ls-remote --exit-code --heads "$remote" "refs/heads/$branch" >/dev/null; then
  echo "错误：远端分支不存在或无法访问：$remote/$branch" >&2
  exit 4
fi

current_branch="$(git branch --show-current)"
if [[ "$current_branch" != "$branch" ]]; then
  if git show-ref --verify --quiet "refs/heads/$branch"; then
    printf '切换到本地分支 %s…\n' "$branch"
    git switch "$branch"
  else
    printf '创建本地跟踪分支 %s…\n' "$branch"
    git fetch "$remote" "refs/heads/$branch:refs/remotes/$remote/$branch"
    git switch --track -c "$branch" "$remote/$branch"
  fi
fi

before="$(git rev-parse --short HEAD)"
printf '正在从 %s/%s 拉取更新…\n' "$remote" "$branch"
git pull --ff-only "$remote" "$branch"
after="$(git rev-parse --short HEAD)"

if [[ "$before" == "$after" ]]; then
  printf '已是最新版本（%s，%s）。\n' "$branch" "$after"
else
  printf '更新完成：%s -> %s（%s）。\n' "$before" "$after" "$branch"
fi
