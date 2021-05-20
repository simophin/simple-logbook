FROM node:12-buster

WORKDIR /app
COPY app .

RUN yarn install && yarn build

FROM rust
WORKDIR /rust_app
COPY . .
COPY --from=0 /app/build app/build

RUN cargo build --release

FROM rust
WORKDIR /app
COPY --from=1 /rust_app/target/release/simple-log-book ./

ENV DATABASE_URL=sqlite:/data/logbook.sqlitedb
VOLUME /data
EXPOSE 4000
ENTRYPOINT /app/simple-log-book