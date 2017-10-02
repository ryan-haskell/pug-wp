FROM wordpress

# Install MySQL client tools (for wp export and import)
RUN apt-get update
RUN apt-get install -y mysql-client

# Install wp-cli
RUN curl -o /usr/local/bin/wp-cli.phar \
    https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
RUN chmod +x /usr/local/bin/wp-cli.phar
RUN mv /usr/local/bin/wp-cli.phar /usr/local/bin/wp

# Remove gross plugins
RUN rm /usr/src/wordpress/wp-content/plugins/hello.php
RUN rm -r /usr/src/wordpress/wp-content/plugins/akismet

# Change entrypoint to enable wp-cli
COPY apache2-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/apache2-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["apache2-entrypoint.sh"]
