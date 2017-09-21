#!/bin/bash

database_name="wordpress"
partial_configuration_filename="0-wordpress-configuration.sql"
partial_admin_content_filename="1-wordpress-admin-content.sql"
configuration_filename="wordpress-configuration.sql"
content_filename="wordpress-content.sql"

container_prefix=
while [ -z $container_prefix ]
do
    echo -n 'Container Prefix: '
    read container_prefix
done

cms_container="${container_prefix}_cms_1"
db_container="${container_prefix}_db_1"
web_container="${container_prefix}_web_1"

# File System
echo "- Backing up Wordpress file system (${cms_container})..."
docker exec $cms_container cp -a /var/www/html/. /usr/src/wordpress/

# Database
echo "- Backing up Wordpress database (${db_container})..."

# Web Server
echo "- Backing up NodeJS web server (${web_container})..."

# Backup Wordpress Configuration (TODO: Move to .sh file in MariaDB Docker image)
docker exec $db_container sh -c "rm /docker-entrypoint-initdb.d/*"
docker exec $db_container mysqldump --user="root" --password="password" --single-transaction --databases $database_name --ignore-table $database_name.wp_posts --result-file /docker-entrypoint-initdb.d/$partial_configuration_filename

docker exec $db_container mysqldump --user="root" --password="password" --single-transaction --databases $database_name --skip-add-drop-table --tables wp_posts --where "post_author IN (SELECT user_id FROM wordpress.wp_usermeta WHERE meta_key = 'wp_capabilities' AND meta_value LIKE '%administrator%' )" --result-file /docker-entrypoint-initdb.d/$partial_admin_content_filename

docker exec $db_container touch /docker-entrypoint-initdb.d/$configuration_filename
docker exec $db_container sh -c "cat /docker-entrypoint-initdb.d/$partial_configuration_filename > /docker-entrypoint-initdb.d/$configuration_filename"
docker exec $db_container sh -c "echo \"\" >> /docker-entrypoint-initdb.d/$configuration_filename"
docker exec $db_container sh -c "echo \"USE $database_name;\" >> /docker-entrypoint-initdb.d/$configuration_filename"
docker exec $db_container sh -c "echo \"\" >> /docker-entrypoint-initdb.d/$configuration_filename"
docker exec $db_container sh -c "cat /docker-entrypoint-initdb.d/$partial_admin_content_filename >> /docker-entrypoint-initdb.d/$configuration_filename"
docker exec $db_container sh -c "rm /docker-entrypoint-initdb.d/$partial_configuration_filename /docker-entrypoint-initdb.d/$partial_admin_content_filename"

# Backup Wordpress Content
docker exec $db_container mysqldump --user="root" --password="password" --single-transaction --databases $database_name --skip-add-drop-table --no-create-info --tables wp_posts --where "post_author IN (SELECT user_id FROM wordpress.wp_usermeta WHERE meta_key = 'wp_capabilities' AND meta_value LIKE '%editor%' )" --result-file /$content_filename.tmp
docker exec $db_container touch /$content_filename
docker exec $db_container sh -c "echo \"USE $database_name;\" >> /$content_filename"
docker exec $db_container sh -c "echo \"\" >> /$content_filename"
docker exec $db_container sh -c "cat /$content_filename.tmp >> /$content_filename"
mkdir -p ./cms/backups
docker cp $db_container:/$content_filename ./cms/backups/wordpress-content.sql
docker exec $db_container sh -c "rm /$content_filename /$content_filename.tmp"
docker exec $db_container sh -c "touch /docker-entrypoint-initdb.d/$content_filename"

# Author and Tag?
author=
while [ -z $author ]
do
    echo -n 'Docker ID: '
    read author
done

tag=
while [ -z $tag ]
do
    echo -n 'Tag: '
    read tag
done

# Commit containers
echo "- Commiting file system (${author}/wp-cms:${tag})..."
docker pause $cms_container
docker commit $cms_container ${author}/wp-cms:${tag}
docker unpause $cms_container

echo "- Commiting database (${author}/wp-db:${tag})..."
docker pause $db_container
docker commit $db_container ${author}/wp-db:${tag}
docker unpause $db_container

echo "- Commiting web server (${author}/wp-web:${tag})..."
docker pause $web_container
docker commit $web_container ${author}/wp-web:${tag}
docker unpause $web_container

# Push to Docker Hub?
should_push=
while [ -z $should_push ]
do
    echo -n 'Push to Docker Hub? (Y/N): '
    read should_push
done

if [ $should_push = "Y" ] || [ $should_push = "y" ]; then
    echo "Pushing..."
    docker push ${author}/wp-cms:${tag}
    docker push ${author}/wp-db:${tag}
    docker push ${author}/wp-web:${tag}
else
    echo "Not pushing."
fi

echo "Done!"