#!/usr/bin/env bash
# ==============================================================================
# GitHub Connectivity & Git Repository Diagnostic Script
# Created for: Omid Adli (omidadli78@gmail.com)
# ==============================================================================

set -e

COLOR_RESET="\033[0m"
COLOR_GREEN="\033[1;32m"
COLOR_YELLOW="\033[1;33m"
COLOR_RED="\033[1;31m"
COLOR_CYAN="\033[1;36m"
COLOR_BLUE="\033[1;34m"

echo -e "${COLOR_CYAN}======================================================${COLOR_RESET}"
echo -e "${COLOR_CYAN}    🔍 GitHub & Git Repository Diagnostic Tool        ${COLOR_RESET}"
echo -e "${COLOR_CYAN}======================================================${COLOR_RESET}"
echo ""

# 1. Check Git Installation
echo -e "${COLOR_BLUE}[1/6] Checking Git Installation...${COLOR_RESET}"
if command -v git >/dev/null 2>&1; then
    GIT_VER=$(git --version)
    echo -e "  ${COLOR_GREEN}✓ Git is installed:${COLOR_RESET} $GIT_VER"
else
    echo -e "  ${COLOR_RED}✗ Git is not installed in the current environment.${COLOR_RESET}"
    exit 1
fi
echo ""

# 2. Check Repository Status
echo -e "${COLOR_BLUE}[2/6] Checking Git Repository Status...${COLOR_RESET}"
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "detached")
    COMMIT_COUNT=$(git rev-list --count HEAD 2>/dev/null || echo "0")
    LATEST_COMMIT=$(git log -1 --oneline 2>/dev/null || echo "No commits yet")
    echo -e "  ${COLOR_GREEN}✓ Inside a Git repository.${COLOR_RESET}"
    echo -e "    - Current branch: ${COLOR_YELLOW}$CURRENT_BRANCH${COLOR_RESET}"
    echo -e "    - Total commits:  ${COLOR_YELLOW}$COMMIT_COUNT${COLOR_RESET}"
    echo -e "    - Latest commit:  ${COLOR_YELLOW}$LATEST_COMMIT${COLOR_RESET}"
else
    echo -e "  ${COLOR_YELLOW}⚠ Current directory is not a Git repository.${COLOR_RESET}"
    echo -e "    Run: git init -b main"
fi
echo ""

# 3. Check Git Identity & Config
echo -e "${COLOR_BLUE}[3/6] Checking Git User Configuration...${COLOR_RESET}"
GIT_USER=$(git config user.name || echo "")
GIT_EMAIL=$(git config user.email || echo "")

if [ -n "$GIT_USER" ]; then
    echo -e "  ${COLOR_GREEN}✓ user.name:${COLOR_RESET}  $GIT_USER"
else
    echo -e "  ${COLOR_YELLOW}⚠ user.name is not configured.${COLOR_RESET} (Set via: git config --global user.name \"Your Name\")"
fi

if [ -n "$GIT_EMAIL" ]; then
    echo -e "  ${COLOR_GREEN}✓ user.email:${COLOR_RESET} $GIT_EMAIL"
else
    echo -e "  ${COLOR_YELLOW}⚠ user.email is not configured.${COLOR_RESET} (Set via: git config --global user.email \"your@email.com\")"
fi
echo ""

# 4. Check Remote Origin
echo -e "${COLOR_BLUE}[4/6] Checking Git Remote Origin...${COLOR_RESET}"
REMOTES=$(git remote -v 2>/dev/null || echo "")
if [ -n "$REMOTES" ]; then
    echo -e "  ${COLOR_GREEN}✓ Configured remotes:${COLOR_RESET}"
    echo "$REMOTES" | sed 's/^/    /'
else
    echo -e "  ${COLOR_YELLOW}⚠ No remote origin configured yet.${COLOR_RESET}"
    echo -e "    To add an HTTPS remote: git remote add origin https://github.com/<username>/<repo>.git"
    echo -e "    To add an SSH remote:   git remote add origin git@github.com:<username>/<repo>.git"
fi
echo ""

# 5. Check HTTPS Connectivity to GitHub API
echo -e "${COLOR_BLUE}[5/6] Testing Network Connectivity to GitHub HTTPS...${COLOR_RESET}"
if command -v curl >/dev/null 2>&1; then
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 https://api.github.com || echo "000")
    if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "301" ] || [ "$HTTP_STATUS" = "302" ]; then
        echo -e "  ${COLOR_GREEN}✓ GitHub HTTPS API is reachable${COLOR_RESET} (HTTP Status: $HTTP_STATUS)"
    else
        echo -e "  ${COLOR_RED}✗ Cannot reach GitHub HTTPS API.${COLOR_RESET} (Status: $HTTP_STATUS / Timeout)"
    fi
else
    echo -e "  ${COLOR_YELLOW}⚠ curl is not available to test HTTPS connectivity.${COLOR_RESET}"
fi
echo ""

# 6. Check SSH Keys & SSH Connectivity
echo -e "${COLOR_BLUE}[6/6] Checking SSH Configuration for GitHub...${COLOR_RESET}"
SSH_DIR="$HOME/.ssh"
HAS_SSH_KEY=false

if [ -d "$SSH_DIR" ]; then
    for key in id_ed25519 id_rsa id_ecdsa; do
        if [ -f "$SSH_DIR/$key" ]; then
            echo -e "  ${COLOR_GREEN}✓ Found SSH private key:${COLOR_RESET} $SSH_DIR/$key"
            HAS_SSH_KEY=true
        fi
        if [ -f "$SSH_DIR/$key.pub" ]; then
            echo -e "  ${COLOR_GREEN}✓ Found SSH public key:${COLOR_RESET}  $SSH_DIR/$key.pub"
        fi
    done
fi

if [ "$HAS_SSH_KEY" = false ]; then
    echo -e "  ${COLOR_YELLOW}⚠ No SSH keys found in $SSH_DIR${COLOR_RESET}"
    echo -e "    To generate an ED25519 SSH key, run:"
    echo -e "      ssh-keygen -t ed25519 -C \"omidadli78@gmail.com\" -f ~/.ssh/id_ed25519 -N \"\""
fi

echo ""
echo -e "${COLOR_CYAN}Testing SSH Authentication to git@github.com...${COLOR_RESET}"
if command -v ssh >/dev/null 2>&1; then
    SSH_OUTPUT=$(ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=5 -T git@github.com 2>&1 || true)
    if echo "$SSH_OUTPUT" | grep -qi "successfully authenticated"; then
        echo -e "  ${COLOR_GREEN}✓ SSH Authentication successful!${COLOR_RESET}"
        echo "    $SSH_OUTPUT"
    elif echo "$SSH_OUTPUT" | grep -qi "Permission denied"; then
        echo -e "  ${COLOR_YELLOW}⚠ SSH key is not added to GitHub or permission denied.${COLOR_RESET}"
        echo "    Output: $SSH_OUTPUT"
    else
        echo -e "    Status: $SSH_OUTPUT"
    fi
else
    echo -e "  ${COLOR_YELLOW}⚠ ssh command not available.${COLOR_RESET}"
fi

echo ""
echo -e "${COLOR_CYAN}======================================================${COLOR_RESET}"
echo -e "${COLOR_CYAN}               Diagnostic Completed                   ${COLOR_RESET}"
echo -e "${COLOR_CYAN}======================================================${COLOR_RESET}"
