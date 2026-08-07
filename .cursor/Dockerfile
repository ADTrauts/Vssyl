FROM node:20-bookworm

ENV DEBIAN_FRONTEND=noninteractive

# PostgreSQL: Debian Bookworm ships postgresql-15 via the metapackage.
# GitHub CI remains the authoritative PostgreSQL 16 validation environment;
# exact 16 parity is deferred to avoid external APT repository complexity.
#
# Chromium/Playwright: install OS libraries here; browser binaries are fetched
# during environment install via `pnpm exec playwright install chromium`.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        sudo \
        curl \
        ca-certificates \
        build-essential \
        python3 \
        openssl \
        postgresql \
        postgresql-contrib \
        postgresql-client \
        libasound2 \
        libatk-bridge2.0-0 \
        libatk1.0-0 \
        libatspi2.0-0 \
        libcairo2 \
        libcups2 \
        libdbus-1-3 \
        libdrm2 \
        libgbm1 \
        libglib2.0-0 \
        libnspr4 \
        libnss3 \
        libpango-1.0-0 \
        libx11-6 \
        libxcb1 \
        libxcomposite1 \
        libxdamage1 \
        libxext6 \
        libxfixes3 \
        libxkbcommon0 \
        libxrandr2 \
        fonts-liberation \
        fonts-noto-color-emoji \
        xvfb \
    && rm -rf /var/lib/apt/lists/*

# Allow password auth from localhost so Prisma can use the CI-parity DATABASE_URL.
RUN set -eux; \
    PG_VERSION="$(ls /usr/lib/postgresql | sort -V | tail -1)"; \
    CONF="/etc/postgresql/${PG_VERSION}/main/postgresql.conf"; \
    HBA="/etc/postgresql/${PG_VERSION}/main/pg_hba.conf"; \
    sed -i "s/^#\\?listen_addresses.*/listen_addresses = 'localhost'/" "$CONF"; \
    printf '%s\n' \
      '# Cloud Agent local workstation (synthetic credentials only)' \
      'local   all             postgres                                peer' \
      'local   all             all                                     peer' \
      'host    all             all             127.0.0.1/32            scram-sha-256' \
      'host    all             all             ::1/128                 scram-sha-256' \
      > "$HBA"

RUN corepack enable \
    && corepack prepare pnpm@10.11.0 --activate
