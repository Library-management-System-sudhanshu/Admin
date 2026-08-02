#!/bin/bash

echo "==============================="
echo "Deploying Admin"
echo "==============================="

git pull

npm install

npm run build

sudo rm -rf /var/www/admin/*

sudo cp -r dist/* /var/www/admin/

sudo chown -R www-data:www-data /var/www/admin

sudo chmod -R 755 /var/www/admin

sudo nginx -t

sudo systemctl reload nginx

echo "Deployment Completed"
