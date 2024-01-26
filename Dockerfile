FROM node:18

WORKDIR /app
COPY app .

RUN yarn install && yarn build

FROM clux/muslrust:stable
WORKDIR /rust_app

COPY . .
COPY --from=0 /app/build app/build

RUN cargo build --release

FROM alpine:latest

RUN apk --no-cache add curl imagemagick libjpeg libpng ghostscript

WORKDIR /app
HEALTHCHECK --interval=10s --timeout=2s CMD curl -fL http://localhost:4000/healthcheck

COPY --from=1 /rust_app/target/x86_64-unknown-linux-musl/release/simple-logbook ./

ENV DATABASE_URL=sqlite:/data/logbook.sqlitedb
ENV HOST=0.0.0.0
VOLUME /data
EXPOSE 4000
ENTRYPOINT /app/simple-logbook
