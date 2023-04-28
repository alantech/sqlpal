# Base run image
FROM node:lts-bullseye-slim AS base

## Install OS Packages
RUN apt update
RUN apt install --no-install-recommends curl jq gnupg ca-certificates python3-pip python3-venv supervisor  -y \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* && mkdir -p /etc/supervisor/conf.d

#####################################################################################################################################################

# Base build image
FROM base AS build

## Install OS and Postgres Dev Packages
RUN apt update
RUN apt install build-essential git make g++ libcurl4-openssl-dev python3-dev -y && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

#####################################################################################################################################################

# Dashboard
FROM build AS dashboard-stage

WORKDIR /dashboard

## Install stage dependencies
COPY dashboard/.yarnrc dashboard/package.json dashboard/yarn.lock ./
RUN yarn install --frozen-lockfile

## Copy files
COPY dashboard/.eslintrc.json dashboard/next.config.js dashboard/postcss.config.js dashboard/tailwind.config.js dashboard/tsconfig.json dashboard/tslint.json ./
COPY dashboard/public public
COPY dashboard/src src

## Build
RUN yarn build

#####################################################################################################################################################

FROM build as sqlpal-stage

ENV LANG=C.UTF-8
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# copy the requirements file into the image
WORKDIR /sqlpal-server
RUN python3 -m venv ./venv
COPY sqlpal-server/requirements.txt ./
RUN . ./venv/bin/activate && pip install --no-cache-dir wheel && pip install --no-cache-dir -r requirements.txt

# copy every content from the local file to the image
COPY sqlpal-server/run.py ./
COPY sqlpal-server/config.py ./
COPY sqlpal-server/app app

#####################################################################################################################################################

# Main stage
FROM base AS main-stage

## Copy from dashboard-stage
WORKDIR /dashboard
COPY --from=dashboard-stage /dashboard/public ./public
COPY --from=dashboard-stage /dashboard/.next/standalone ./
COPY --from=dashboard-stage /dashboard/.next/static ./.next/static

## Copy from sqlpal-stage
WORKDIR /sqlpal-server
COPY --from=sqlpal-stage /sqlpal-server/requirements.txt ./
COPY --from=sqlpal-stage /sqlpal-server/app ./app
COPY --from=sqlpal-stage /sqlpal-server/run.py ./
COPY --from=sqlpal-stage /sqlpal-server/config.py ./
COPY --from=sqlpal-stage /sqlpal-server/venv ./venv

WORKDIR /

## Default ENVs that can be overwritten
ARG IASQL_ENV=local
ENV IASQL_ENV=$IASQL_ENV
ARG IASQL_TELEMETRY=on
ENV IASQL_TELEMETRY=$IASQL_TELEMETRY
ARG DB_USER=postgres
ENV DB_USER=$DB_USER
ARG DB_PASSWORD=test
ENV DB_PASSWORD=$DB_PASSWORD
ARG AUTOCOMPLETE_ENDPOINT=http://localhost:5001
ENV AUTOCOMPLETE_ENDPOINT=

## Ports
EXPOSE 9876

COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
CMD ["/usr/bin/supervisord"]
