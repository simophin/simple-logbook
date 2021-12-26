#  Simple Logbook - Personal finance record book

Simple Logbook is a self-hosted solution for recording day-to-day financial transaction. 
Under the hood it's using the [double-entry bookkeeping method](https://en.wikipedia.org/wiki/Double-entry_bookkeeping).

### Hightlight
* All data written into a single SQLite database
* The data schema is rigid and easy to understand (dev friendly)
* Resource friendly: backend app is written in Rust
* Beautiful graph
* Super easy to use transaction recording
* Easy to deploy

### Screenshots

#### Transactions

![transaction](https://user-images.githubusercontent.com/273191/147421810-c2631a38-610a-4ece-ad41-d37bba894c10.png)

#### Fast entry

Don't repeat yourself on your frequently entered item!

![fast-entry](https://user-images.githubusercontent.com/273191/147421886-a1b472d0-df72-4ab2-b1f6-26e16f2ee301.gif)


#### Beautiful graph

See your spending trend!

![graph](https://user-images.githubusercontent.com/273191/147421899-27757a87-08ff-43ac-8c74-cd348085a3d2.gif)


### Installation

#### Docker

```bash
docker run -d \
  -v HOST_DATA_DIRECTORY:/data \
  -p 4000:4000 \
  ghcr.io/simophin/simple-logbook
```

Then go to http://localhost:4000

#### Others
Work in progress. More installation methods will be added once they are implemented.
