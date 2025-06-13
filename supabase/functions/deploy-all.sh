#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to find project root by looking for .supabase directory
find_project_root() {
  local current_dir="$SCRIPT_DIR"
  
  # Go up the directory tree looking for .supabase
  while [ "$current_dir" != "/" ]; do
    if [ -d "$current_dir/.supabase" ]; then
      echo "$current_dir"
      return 0
    fi
    current_dir="$(dirname "$current_dir")"
  done
  
  # If not found, check common locations relative to script
  for try_dir in "$SCRIPT_DIR/../.." "$SCRIPT_DIR/.." "$SCRIPT_DIR"; do
    if [ -d "$try_dir/.supabase" ]; then
      echo "$(cd "$try_dir" && pwd)"
      return 0
    fi
  done
  
  return 1
}

# Function to check if supabase CLI is installed
check_supabase_cli() {
  if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found!${NC}"
    echo -e "${YELLOW}Install it with: npm install -g supabase${NC}"
    exit 1
  fi
}

# Main deployment function
main() {
  echo -e "${BLUE}🚀 Supabase Edge Functions Deployment${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  # Check if supabase CLI is installed
  check_supabase_cli
  
  # Find and navigate to project root
  PROJECT_ROOT=$(find_project_root)
  
  if [ -z "$PROJECT_ROOT" ]; then
    echo -e "${RED}❌ Could not find .supabase directory${NC}"
    echo -e "${YELLOW}📍 Current location: $SCRIPT_DIR${NC}"
    echo ""
    echo -e "${YELLOW}To fix this issue:${NC}"
    echo "1. Navigate to your project root directory"
    echo "2. Run: supabase link --project-ref <your-project-ref>"
    echo "3. Run this script again"
    echo ""
    echo "Your project-ref can be found in your Supabase dashboard URL:"
    echo "https://app.supabase.com/project/[your-project-ref]"
    exit 1
  fi
  
  cd "$PROJECT_ROOT"
  echo -e "${GREEN}✅ Found project root: $PROJECT_ROOT${NC}"
  
  # Check if we're linked to a project
  echo -e "${BLUE}🔗 Checking Supabase project link...${NC}"
  
  if ! supabase status &>/dev/null; then
    echo -e "${RED}❌ Not linked to a Supabase project${NC}"
    echo ""
    echo -e "${YELLOW}To link your project:${NC}"
    echo "supabase link --project-ref <your-project-ref>"
    echo ""
    echo "Find your project-ref in your Supabase dashboard URL"
    exit 1
  fi
  
  # Display project info
  echo -e "${GREEN}✅ Project linked successfully${NC}"
  echo ""
  supabase status
  echo ""
  
  # List of functions to deploy
  functions=(
    "sync-setlists"
    "sync-spotify"
    "calculate-trending"
    "sync-artists"
    "cleanup-old-data"
  )
  
  # Deploy counters
  deployed=0
  failed=0
  
  echo -e "${BLUE}📦 Deploying ${#functions[@]} functions...${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  # Deploy each function
  for func in "${functions[@]}"; do
    echo -e "\n${BLUE}📦 Deploying $func...${NC}"
    
    # Check if function directory exists
    func_path="$PROJECT_ROOT/supabase/functions/$func"
    if [ ! -d "$func_path" ]; then
      echo -e "${RED}❌ Function directory not found: $func_path${NC}"
      ((failed++))
      continue
    fi
    
    # Deploy with --no-verify-jwt flag for cron functions
    if supabase functions deploy "$func" --no-verify-jwt; then
      echo -e "${GREEN}✅ $func deployed successfully${NC}"
      ((deployed++))
    else
      echo -e "${RED}❌ Failed to deploy $func${NC}"
      ((failed++))
    fi
  done
  
  # Summary
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "${BLUE}📊 Deployment Summary${NC}"
  echo -e "${GREEN}✅ Successfully deployed: $deployed${NC}"
  if [ $failed -gt 0 ]; then
    echo -e "${RED}❌ Failed: $failed${NC}"
  fi
  
  # Next steps
  echo ""
  echo -e "${BLUE}📝 Next Steps:${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  echo -e "\n${YELLOW}1. Set environment secrets (if not already set):${NC}"
  echo "   Run these commands from your project root:"
  echo ""
  echo "   supabase secrets set CRON_SECRET=<your-secret>"
  echo "   supabase secrets set SPOTIFY_CLIENT_ID=<your-client-id>"
  echo "   supabase secrets set SPOTIFY_CLIENT_SECRET=<your-client-secret>"
  echo "   supabase secrets set TICKETMASTER_API_KEY=<your-api-key>"
  echo "   supabase secrets set SETLISTFM_API_KEY=<your-api-key>"
  
  echo -e "\n${YELLOW}2. Configure cron schedules:${NC}"
  echo "   Go to your Supabase Dashboard > Edge Functions"
  echo "   Set up cron triggers for each function"
  
  echo -e "\n${YELLOW}3. Test your functions:${NC}"
  echo "   supabase functions invoke <function-name>"
  
  echo -e "\n${YELLOW}4. Monitor logs:${NC}"
  echo "   supabase functions logs <function-name> --tail"
  
  echo ""
  echo -e "${GREEN}🎉 Deployment process completed!${NC}"
}

# Run main function
main