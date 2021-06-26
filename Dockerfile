FROM node:14

WORKDIR /app
COPY app .

RUN yarn install && yarn build

FROM rust
WORKDIR /rust_app

COPY Cargo.lock Cargo.toml ./
RUN mkdir src && \
    echo "fn main() { todo!() }" > src/main.rs
RUN cargo build --release && rm -rf src

COPY . .
COPY --from=0 /app/build app/build

RUN cargo build --release

FROM ubuntu

WORKDIR /app
RUN apt update -y && apt install -y curl
HEALTHCHECK --interval=10s --timeout=2s CMD curl -fL http://localhost:4000/healthcheck

COPY --from=1 /rust_app/target/release/simple-log-book ./

ENV DATABASE_URL=sqlite:/data/logbook.sqlitedb
ENV HOST=0.0.0.0
VOLUME /data
EXPOSE 4000
ENTRYPOINT /app/simple-log-book