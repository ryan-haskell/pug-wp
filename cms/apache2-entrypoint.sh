#!/bin/bash

# Install wordpress (https://developer.wordpress.org/cli/commands/core/install/)
wp --allow-root core install \
    --url=http://localhost:8080 \
    --title=$WP_SITE_TITLE \
    --admin_user=$WP_ADMIN_USER \
    --admin_password=$WP_ADMIN_PASSWORD \
    --admin_email=$WP_ADMIN_EMAIL \
    --skip-email

# Install and activate plugins (https://developer.wordpress.org/cli/commands/plugin/install/)
wp --allow-root plugin install acf-to-rest-api --version=2.2.1 --activate
wp --allow-root plugin install advanced-custom-fields --version=4.4.12 --activate
wp --allow-root plugin install custom-post-type-ui --version=1.5.5 --activate
wp --allow-root plugin install admin-menu-editor --version=1.8 --activate
wp --allow-root plugin activate rest-api-cors

# Allow wordpress to modify its stuff
chown -R www-data:www-data /var/www/html

# Run apache server
apache2-foreground
