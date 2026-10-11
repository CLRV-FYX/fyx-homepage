#!/usr/bin/env bash
# ==============================================================================
# FYX Homepage - 自动更新脚本 (update.sh)
# 用途：从远程 Git 仓库指定分支拉取最新代码、安装依赖、构建前端并准备就绪。
# 默认分支：当前对话分支 (arena/8cd56a9a-fyx-homepage)
# ==============================================================================

set -e

# 颜色配置
COLOR_RESET="\033[0m"
COLOR_BOLD="\033[1m"
COLOR_GREEN="\033[32m"
COLOR_BLUE="\033[34m"
COLOR_YELLOW="\033[33m"
COLOR_RED="\033[31m"
COLOR_CYAN="\033[36m"

info() {
  echo -e "${COLOR_CYAN}[INFO]${COLOR_RESET} $1"
}

success() {
  echo -e "${COLOR_GREEN}[SUCCESS]${COLOR_RESET} ${COLOR_BOLD}$1${COLOR_RESET}"
}

warn() {
  echo -e "${COLOR_YELLOW}[WARN]${COLOR_RESET} $1"
}

error() {
  echo -e "${COLOR_RED}[ERROR]${COLOR_RESET} $1" >&2
}

# 帮助信息
show_help() {
  cat << EOF
使用方法:
  ./update.sh [分支名] [选项]

说明:
  从指定的 Git 分支拉取最新代码，自动备份数据、安装依赖并构建。
  如果不传分支名，默认使用当前对话分支: arena/8cd56a9a-fyx-homepage
  【支持 ZIP 部署环境】：若当前目录非 Git 仓库，脚本会自动初始化 Git 关联远程并同步！

参数:
  分支名          可选。远程分支名称（例如: arena/8cd56a9a-fyx-homepage, main）

选项:
  -h, --help      显示本帮助信息并退出
  --repo=URL      指定远程仓库地址（默认: https://github.com/CLRV-FYX/fyx-homepage.git）
  --registry=URL  指定 npm 源（默认: https://registry.npmmirror.com）
  --build         强制在本地重新执行前端构建 (npm run build)
  --no-build      跳过前端构建
  --no-install    跳过 npm install
  --force         强制覆盖本地修改（注意：db.json 仍会被自动备份）

示例:
  ./update.sh                                # 默认从 arena/8cd56a9a-fyx-homepage 拉取更新（使用 npmmirror 源）
  ./update.sh main                           # 从 main 分支拉取更新
  ./update.sh arena/8cd56a9a-fyx-homepage    # 显式指定从当前对话分支拉取
EOF
}

# 默认分支设置为当前对话分支
DEFAULT_BRANCH="arena/8cd56a9a-fyx-homepage"
DEFAULT_REPO_URL="https://github.com/CLRV-FYX/fyx-homepage.git"
REPO_URL="$DEFAULT_REPO_URL"
TARGET_BRANCH=""
NPM_REGISTRY="https://registry.npmmirror.com"
SKIP_BUILD=false
FORCE_BUILD=false
SKIP_INSTALL=false
FORCE_PULL=false

# 解析参数
for arg in "$@"; do
  case "$arg" in
    -h|--help)
      show_help
      exit 0
      ;;
    --repo=*)
      REPO_URL="${arg#*=}"
      ;;
    --registry=*)
      NPM_REGISTRY="${arg#*=}"
      ;;
    --build)
      FORCE_BUILD=true
      ;;
    --no-build)
      SKIP_BUILD=true
      ;;
    --no-install)
      SKIP_INSTALL=true
      ;;
    --force)
      FORCE_PULL=true
      ;;
    *)
      if [ -z "$TARGET_BRANCH" ]; then
        TARGET_BRANCH="$arg"
      else
        warn "未知参数: $arg (已忽略)"
      fi
      ;;
  esac
done

if [ -z "$TARGET_BRANCH" ]; then
  TARGET_BRANCH="$DEFAULT_BRANCH"
fi

# 1. 确保定位到仓库根目录
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# 自动处理 Git safe.directory 检查（彻底避免宝塔面板、容器或 root/www 用户权限不一致时的 dubious ownership 拦截）
if command -v git >/dev/null 2>&1; then
  git config --global --add safe.directory "$PROJECT_DIR" 2>/dev/null || true
fi

echo -e "${COLOR_BOLD}======================================================${COLOR_RESET}"
echo -e "${COLOR_BOLD}  FYX 个人主页 · 自动更新程序${COLOR_RESET}"
echo -e "  目标更新分支: ${COLOR_BLUE}${TARGET_BRANCH}${COLOR_RESET}"
echo -e "  项目所在目录: ${COLOR_CYAN}${PROJECT_DIR}${COLOR_RESET}"
echo -e "${COLOR_BOLD}======================================================${COLOR_RESET}"

# 2. 检查必要命令
for cmd in git node npm; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    error "未检测到必要的命令: $cmd，请先安装后再执行更新。"
    exit 1
  fi
done

# 3. 检查与准备 Git 仓库状态（支持非 Git / ZIP 解压目录自动转为 Git 仓库）
DATA_DIR="$PROJECT_DIR/server/data"
BACKUP_DIR="$DATA_DIR/backups"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

NEED_INITIAL_SETUP=false
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  NEED_INITIAL_SETUP=true
  warn "检测到当前目录不是 Git 仓库（可能是通过 ZIP 压缩包下载解压部署的）。"
elif ! git rev-parse HEAD >/dev/null 2>&1; then
  NEED_INITIAL_SETUP=true
  warn "检测到本地 Git 仓库尚未完成首次分支检出。"
fi

if [ "$NEED_INITIAL_SETUP" = true ]; then
  info "正在自动初始化 Git 并关联远程仓库: $REPO_URL ..."

  # 临时安全保存已有数据库与敏感数据
  TEMP_BACKUP_DIR="/tmp/fyx_data_save_$$_${TIMESTAMP}"
  mkdir -p "$TEMP_BACKUP_DIR"
  if [ -f "$DATA_DIR/db.json" ]; then
    cp "$DATA_DIR/db.json" "$TEMP_BACKUP_DIR/db.json"
    info "已暂存现有用户数据库 server/data/db.json"
  fi
  if [ -f "$DATA_DIR/secret" ]; then
    cp "$DATA_DIR/secret" "$TEMP_BACKUP_DIR/secret"
  fi

  # 初始化 Git 仓库并设置远程地址
  git init
  git config --global --add safe.directory "$PROJECT_DIR" 2>/dev/null || true
  git remote remove origin 2>/dev/null || true
  git remote add origin "$REPO_URL"

  # 拉取目标分支
  info "正在从远程仓库获取分支最新状态: $TARGET_BRANCH ..."
  if ! git fetch origin "$TARGET_BRANCH" --tags; then
    error "获取远程分支 $TARGET_BRANCH 失败！请检查服务器出网连接是否可访问 GitHub。"
    rm -rf "$TEMP_BACKUP_DIR"
    exit 1
  fi

  # 强制切换检出远程目标分支，覆盖解压出的旧文件
  info "正在检出并关联远程分支: $TARGET_BRANCH ..."
  git checkout -f -B "$TARGET_BRANCH" "origin/$TARGET_BRANCH"

  # 还原并备份用户业务数据
  if [ -f "$TEMP_BACKUP_DIR/db.json" ]; then
    mkdir -p "$BACKUP_DIR"
    cp "$TEMP_BACKUP_DIR/db.json" "$DATA_DIR/db.json"
    cp "$TEMP_BACKUP_DIR/db.json" "$BACKUP_DIR/db_${TIMESTAMP}.json"
    success "已保留并恢复本地原有数据库（并备份至 server/data/backups/db_${TIMESTAMP}.json）"
  fi
  if [ -f "$TEMP_BACKUP_DIR/secret" ]; then
    cp "$TEMP_BACKUP_DIR/secret" "$DATA_DIR/secret"
  fi
  rm -rf "$TEMP_BACKUP_DIR"

  success "已成功将本目录转换为 Git 仓库并与分支 $TARGET_BRANCH 同步完成！"
else
  # 针对已有 Git 仓库的更新流程
  REMOTE_NAME="origin"
  if ! git remote | grep -q "^${REMOTE_NAME}$"; then
    REMOTE_NAME="$(git remote | head -n 1)"
    if [ -z "$REMOTE_NAME" ]; then
      warn "未检测到远程仓库，正在自动配置 origin -> $REPO_URL"
      git remote add origin "$REPO_URL"
      REMOTE_NAME="origin"
    else
      warn "未找到 origin，改用远程仓库: $REMOTE_NAME"
    fi
  fi

  # 4. 安全保护：备份 server/data/ 中的核心数据 (db.json, secret)
  if [ -f "$DATA_DIR/db.json" ]; then
    mkdir -p "$BACKUP_DIR"
    cp "$DATA_DIR/db.json" "$BACKUP_DIR/db_${TIMESTAMP}.json"
    info "已自动备份当前数据库: server/data/backups/db_${TIMESTAMP}.json"
  fi

  if [ -f "$DATA_DIR/secret" ]; then
    mkdir -p "$BACKUP_DIR"
    cp "$DATA_DIR/secret" "$BACKUP_DIR/secret_${TIMESTAMP}"
  fi

  # 5. 拉取远程分支最新状态
  info "正在从远程仓库 ($REMOTE_NAME) 获取分支信息: $TARGET_BRANCH ..."
  if ! git fetch "$REMOTE_NAME" "$TARGET_BRANCH" --tags; then
    error "获取远程分支 $TARGET_BRANCH 失败，请检查网络连接及分支名称是否存在。"
    exit 1
  fi

  # 6. 处理本地工作区变动并切换分支
  CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '')"
  HAS_DIRTY_CHANGES=false

  if [ -n "$(git status --porcelain)" ]; then
    HAS_DIRTY_CHANGES=true
  fi

  if [ "$FORCE_PULL" = true ]; then
    warn "启用了 --force 选项，将丢弃工作区中未提交的代码变更（数据库已在上方备份）"
    git reset --hard HEAD
  elif [ "$HAS_DIRTY_CHANGES" = true ]; then
    info "检测到本地工作区存在变动，执行 git stash 暂存修改..."
    git stash push -m "update.sh auto-stash before updating to $TARGET_BRANCH at $TIMESTAMP"
  fi

  # 切换或检出分支
  if [ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ]; then
    info "正在切换分支: $CURRENT_BRANCH -> $TARGET_BRANCH ..."
    if git show-ref --verify --quiet "refs/heads/$TARGET_BRANCH"; then
      git checkout "$TARGET_BRANCH"
    else
      git checkout -b "$TARGET_BRANCH" "$REMOTE_NAME/$TARGET_BRANCH"
    fi
  fi

  # 拉取合并更新
  info "正在合并最新代码 ($REMOTE_NAME/$TARGET_BRANCH) ..."
  if [ "$FORCE_PULL" = true ]; then
    git reset --hard "$REMOTE_NAME/$TARGET_BRANCH"
  else
    if ! git merge --ff-only "$REMOTE_NAME/$TARGET_BRANCH" 2>/dev/null; then
      warn "无法进行快进合并 (Fast-Forward)，尝试普通合并..."
      git merge "$REMOTE_NAME/$TARGET_BRANCH" --no-edit || {
        error "代码合并发生冲突！请手动检查并解决冲突后重新运行。"
        exit 1
      }
    fi
  fi

  # 恢复暂存的内容（如果有）
  if [ "$HAS_DIRTY_CHANGES" = true ] && [ "$FORCE_PULL" = false ]; then
    info "正在恢复此前暂存的本地修改..."
    if ! git stash pop 2>/dev/null; then
      warn "恢复 stash 存在冲突，已保留 stash 记录，请手动检查 git status"
    fi
  fi
fi

CURRENT_COMMIT="$(git rev-parse --short HEAD)"
CURRENT_COMMIT_MSG="$(git log -1 --pretty=%B | head -n 1)"
success "代码更新完成！当前版本: ${CURRENT_COMMIT} (\"${CURRENT_COMMIT_MSG}\")"

# 7. 安装依赖（默认使用 npmmirror 镜像源加速）
if [ "$SKIP_INSTALL" = false ]; then
  info "正在检查并更新依赖 (npm install --registry=$NPM_REGISTRY) ..."
  npm install --registry="$NPM_REGISTRY"
  success "依赖更新成功！"
else
  info "跳过依赖安装 (--no-install)"
fi

# 8. 前端构建处理
# 本项目已随分支内置了最新同步的生产构建资源 (dist/)。
# 若源码完整（存在 src/pages/Home.tsx）且未声明跳过，或指定了 --build 选项时执行构建；
# 否则直接使用内置的高质量 dist/ 资源，避免不必要的重复编译与源码缺失报错。
if [ "$FORCE_BUILD" = true ] || ([ "$SKIP_BUILD" = false ] && [ -f "$PROJECT_DIR/src/pages/Home.tsx" ]); then
  info "正在执行前端构建 (npm run build) ..."
  if npm run build; then
    success "前端构建完成 (dist/)！"
  elif [ -f "$PROJECT_DIR/dist/index.html" ]; then
    warn "npm run build 异常，已回退直接使用内置 dist/ 资源，服务依然可正常运行。"
  else
    error "前端构建失败且未找到 dist 资源，请检查构建环境！"
    exit 1
  fi
elif [ -f "$PROJECT_DIR/dist/index.html" ]; then
  info "检测到生产环境内置预构建资源已就绪 (dist/)，直接使用现有资源启动。"
else
  info "正在执行前端构建 (npm run build) ..."
  npm run build
fi

# 9. 服务状态检查与提示
echo ""
echo -e "${COLOR_BOLD}======================================================${COLOR_RESET}"
success "FYX 个人主页更新完毕！"
echo -e "${COLOR_BOLD}======================================================${COLOR_RESET}"

# 检查常见守护进程 PM2
if command -v pm2 >/dev/null 2>&1; then
  PM2_PROC="$(pm2 jlist 2>/dev/null | grep -o '"name":"[^"]*fyx[^"]*"' | head -n 1 | cut -d'"' -f4 || true)"
  if [ -n "$PM2_PROC" ]; then
    info "检测到 PM2 进程: $PM2_PROC，正在重启服务..."
    pm2 restart "$PM2_PROC"
    success "PM2 进程 $PM2_PROC 重启完成！"
  fi
fi

echo -e "你可以通过以下命令启动或重启服务："
echo -e "  ${COLOR_CYAN}npm start${COLOR_RESET}        # 启动后端服务（端口 9527）"
echo -e "  ${COLOR_CYAN}npm run dev${COLOR_RESET}      # 本地前端开发预览（端口 5199）"
echo ""
