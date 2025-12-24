FROM php:8.2-fpm-alpine3.20

# Install dependencies
RUN apk add --no-cache \
    freetype-dev \
    libjpeg-turbo-dev \
    libpng-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    curl \
    oniguruma-dev \
    icu-dev

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring zip exif pcntl bcmath intl gd

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Add user for laravel application
RUN addgroup -g 1000 -S www && \
    adduser -u 1000 -S www -G www

USER www

EXPOSE 9000
CMD ["php-fpm"]
