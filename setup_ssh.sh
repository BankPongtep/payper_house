#!/bin/bash

KEY_PATH="$HOME/.ssh/id_ed25519"
TARGET_HOST="192.168.150.16"
TARGET_USER="root"

echo "Checking for existing SSH key..."
if [ ! -f "$KEY_PATH" ]; then
    echo "Generating new SSH key ($KEY_PATH)..."
    ssh-keygen -t ed25519 -f "$KEY_PATH" -N ""
else
    echo "SSH key already exists."
fi

echo "Copying public key to $TARGET_USER@$TARGET_HOST..."
echo "Please enter the password for $TARGET_USER@$TARGET_HOST one last time:"

ssh-copy-id -i "$KEY_PATH.pub" "$TARGET_USER@$TARGET_HOST"

echo "Setup complete! You can now deploy without a password."
