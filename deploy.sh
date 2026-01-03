#!/bin/bash
TARGET_HOST="192.168.150.16"
TARGET_USER="root"
TARGET_DIR="/var/www/payper_house"

echo "Deploying to $TARGET_USER@$TARGET_HOST:$TARGET_DIR..."

# Create directory if not exists
ssh $TARGET_USER@$TARGET_HOST "mkdir -p $TARGET_DIR"

# Sync files
rsync -avz --exclude 'vendor' \
           --exclude 'node_modules' \
           --exclude '.git' \
           --exclude '.env' \
           --exclude 'deploy.sh' \
           --exclude 'docker' \
           --exclude 'tests' \
           --exclude 'bootstrap/cache/*.php' \
           --exclude 'public/hot' \
           ./ $TARGET_USER@$TARGET_HOST:$TARGET_DIR

# Set permissions for web user
ssh $TARGET_USER@$TARGET_HOST "chown -R www-data:www-data $TARGET_DIR"
ssh $TARGET_USER@$TARGET_HOST "chmod -R 775 $TARGET_DIR/storage $TARGET_DIR/bootstrap/cache"

echo "Files synced successfully."
