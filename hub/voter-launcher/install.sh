#!/bin/bash

if [ -s ${PWD}/Voter.desktop ]; then
  rm -r Voter.desktop
fi
echo "#!/usr/bin/env xdg-open
[Desktop Entry]
Name=Voter
Exec=google-chrome https://localhost:8543/voter --incognito --kiosk --user-data-dir=$(mktemp -d) --allow-insecure-localhost -disable-infobars --use-fake-ui-for-media-stream
Comment=Voter
Terminal=false
Type=Application
Icon="${PWD}"/launcher-icon.png" >> Voter.desktop
chmod +x Voter.desktop
