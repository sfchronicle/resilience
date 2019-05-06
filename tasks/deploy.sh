#!/bin/bash

# Run with ./deploy.sh
# Params: subfolder, *project-name
# (starred params are optional)

# stage or prod - Whether the project should deploy to test-proj or the provided project-config subfolder
# NOTE: ^ this script will not create subfolders! They must already exist.
# project name can only be set in project-config.json using the slug field

# Var to track our error state
e="success"

# Callout color for important info
RED='\033[0;31m' 
GREEN='\033[0;32m'  
NC='\033[0m' # No color

# Spinner graphic for the upload delay
spinner(){
  local pid=$!
  local delay=0.15
  local spinstr='|/-\'
  while [ "$(ps a | awk '{print $1}' | grep $pid)" ]; do
    local temp=${spinstr#?}
    printf " (%c)" "$spinstr"
    local spinstr=$temp${spinstr%"$temp"}
    sleep $delay
    printf "\b\b\b\b\b\b"
  done
  printf "    \b\b\b\b"
}

# param 1 is the directory, param 2 is the old extension, param 3 (if true) converts html to php
updateFile(){
	echo "Running file updates..."
	# JS doesn't really need cache busting anymore -- leave as comment just in case
  # perl -pi -e $replaceJS $1/*.$2
  perl -pi -e $replaceCSS $1/*.$2
  # perl -pi -e $queryJS $1/*.$2
  perl -pi -e $queryCSS $1/*.$2
  if [ "$3" == "true" ]; then
  	# NOTE: This appears to update all HTML in the directory, not just current folder -- modify if that's an issue
  	find . -name "*.html" -exec bash -c 'mv "$1" "${1%.html}".php' - '{}' \;
  fi
}

key="PROJECT"
re="\"($key)\": \"([^\"]*)\""

if [ -z "$1" ]; then
	echo -e "${RED}ERROR:${NC} stage vs prod not specified!"
	echo "Exiting deploy script with error..."
	exit 1
fi

if [ "$1" != "app" ] && [ "$1" != "stage" ] && [ "$1" != "prod" ]; then
	echo -e "${RED}ERROR:${NC} First argument must be stage, prod or app!"
	echo "Exiting deploy script with error..."
	exit 1
fi

if [ "$1" == "app" ]; then
	subfolder="app"
fi


if [ "$1" == "stage" ]; then
	subfolder="test-proj"
fi

if [ "$1" == "prod" ]; then
	subfolder=$(node -pe 'JSON.parse(process.argv[1]).PROJECT.SUBFOLDER' "$(cat project-config.json)")
fi

if [ -z "$2" ]; then
	# If no value supplied, it's a manual deploy
	deploy_type="manual"
else 
	# It's an auto-deploy, so no confirmation needed
	deploy_type="auto"
fi

slug=$(node -pe 'JSON.parse(process.argv[1]).PROJECT.SLUG' "$(cat project-config.json)")

if [ -z "$slug" ]; then
	echo -e "${RED}ERROR:${NC} Slug cannot be blank!"
	echo "Exiting deploy script with error..."
	exit 1
fi

if [ -d "public/" ]; then
	echo -e "${GREEN}SUCCESS:${NC} Public folder exists for this project."
else
	echo -e "${RED}ERROR:${NC} No 'public' folder exists in this project!"
	echo "Exiting deploy script with error..."
	exit 1
fi

echo "Copying build to export..."
cp -a public/. "./public_export"

# Test if we can access the Projects folder
if [ -d "/Volumes/SFGextras/Projects/" ]; then
  echo -e "${GREEN}SUCCESS:${NC} Accessed Projects folder."
  # Test if we can access the specified subfolder
  if [ -d "/Volumes/SFGextras/Projects/$subfolder" ]; then
  	echo -e "${GREEN}SUCCESS:${NC} Accessed $subfolder folder."
  	# Prompt before we pull the trigger
  	echo -e "All systems go. You are going to deploy ${RED}$slug${NC} to the live Projects server in subfolder ${RED}$subfolder${NC} with name ${RED}$slug${NC}." 
  	read -p "Proceed (Y/n)? " -n 1 -r
		echo ""  # For spacing
		if [[ $REPLY =~ ^[Yy]$ ]] || [ $deploy_type == "auto" ]; then
		  echo "User confirmed deployment. Starting..."

			echo "Create folders in temp location if needed"
			if [ ! -d "/Volumes/SFGextras/Projects/temp-deploy/$subfolder" ]; then
				echo "Folder '$subfolder' created!"
			  mkdir "/Volumes/SFGextras/Projects/temp-deploy/$subfolder"
			fi

			# Uncomment the lines below to prevent actual deploy for testing
			# echo "EXIT EARLY!"
			# exit 1

		  echo "Uploading files to server in temp location..."
		  # Only send command to background if it's a manual deploy
		  if [ $deploy_type == "auto" ]; then
		  	# Make auto deploy wait for full completion, or else files will be deleted too soon
		  	cp -a public_export/. "/Volumes/SFGextras/Projects/temp-deploy/$subfolder/$slug"
		  else
		  	# Put the rebuild for dev into a subshell so we don't hear about it
		  	(gatsby build >/dev/null &)
		  	# Manual deploys get cool spinner
		  	cp -a public_export/. "/Volumes/SFGextras/Projects/temp-deploy/$subfolder/$slug" &
		  	spinner
		  fi

		  echo "Replacing .html extension with .php"
		  find "/Volumes/SFGextras/Projects/temp-deploy/$subfolder/$slug" -name "*.html" -exec bash -c 'mv "$1" "${1%.html}".php' - '{}' \;

		  echo "Deleting old files if they exist"
		  rm -rf "/Volumes/SFGextras/Projects/$subfolder/$slug"

		  echo "Moving new files into final location"
		  mv "/Volumes/SFGextras/Projects/temp-deploy/$subfolder/$slug" "/Volumes/SFGextras/Projects/$subfolder/$slug"
		  echo -e "${GREEN}DEPLOY COMPLETE.${NC} Exiting..."
		else 
			echo "INFO: User cancelled deployment. Exiting and rebuilding for dev..."
			gatsby build >/dev/null
		fi
  else
		# We couldn't access subfolder
		echo -e "${RED}ERROR:${NC}: Subfolder $1 does not exist or cannot be accessed!"
		e="error"
	fi
else
	# We couldn't access /Projects/
	echo -e "${RED}ERROR:${NC}: Projects folder does not exist or cannot be accessed!"
	e="error"
fi

if [ "$e" == "error" ]; then
	echo "Exiting deploy script with error..."
fi
