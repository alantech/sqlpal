# Base run image
FROM node:lts-bullseye-slim AS base

## Install OS Packages
RUN apt update
RUN apt install --no-install-recommends curl jq gnupg ca-certificates python3-pip python3-venv supervisor default-libmysqlclient-dev -y \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* && mkdir -p /etc/supervisor/conf.d

## Install mssql dependencies. Following: https://learn.microsoft.com/en-us/sql/connect/odbc/linux-mac/installing-the-microsoft-odbc-driver-for-sql-server?view=sql-server-ver16&tabs=debian18-install%2Calpine17-install%2Cdebian8-install%2Credhat7-13-install%2Crhel7-offline#18
RUN curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add -

### Download appropriate package for the OS version
### Debian 11
RUN curl https://packages.microsoft.com/config/debian/11/prod.list > /etc/apt/sources.list.d/mssql-release.list

RUN apt update
RUN ACCEPT_EULA=Y apt install -y msodbcsql18 \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

#####################################################################################################################################################

# Base build image
FROM base AS build

## Install OS and Postgres Dev Packages
RUN apt update
RUN apt install build-essential git make g++ libcurl4-openssl-dev python3-dev -y && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

#####################################################################################################################################################

FROM build as sqlpal-stage

ENV LANG=C.UTF-8
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# copy the requirements file into the image
WORKDIR /sqlpal-server
RUN python3 -m venv ./venv
COPY sqlpal-server/requirements.txt ./
RUN . ./venv/bin/activate && pip install wheel && pip install --no-compile --disable-pip-version-check -r requirements.txt

# copy every content from the local file to the image
COPY sqlpal-server/run.py ./
COPY sqlpal-server/config.py ./
COPY sqlpal-server/app app

#####################################################################################################################################################

# Main stage
FROM base AS main-stage

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
ARG AUTOCOMPLETE_ENDPOINT=http://localhost:8088
ENV AUTOCOMPLETE_ENDPOINT=

## Ports
EXPOSE 8088

COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
CMD ["/usr/bin/supervisord"]
