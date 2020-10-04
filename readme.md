# db-rest

**A clean REST API wrapping around the [Deutsche Bahn HAFAS API](https://github.com/public-transport/db-hafas#db-hafas).** It is deployed at [`v5.db.transport.rest`](https://v5.db.transport.rest/).

[**API Documentation**](docs/index.md)

![db-rest architecture diagram](architecture.svg)

[![API status](https://badgen.net/uptime-robot/status/m784879516-8a977fa91b975fc3884a9857)](https://stats.uptimerobot.com/57wNLs39M/784879516)
[![Docker build status](https://img.shields.io/docker/build/derhuerst/db-rest.svg)](https://hub.docker.com/r/derhuerst/db-rest/)
[![dependency status](https://img.shields.io/david/derhuerst/db-rest.svg)](https://david-dm.org/derhuerst/db-rest)
![ISC-licensed](https://img.shields.io/github/license/derhuerst/db-rest.svg)
[![gitter channel](https://badges.gitter.im/derhuerst/db-rest.svg)](https://gitter.im/derhuerst/db-rest)
[![support me on Patreon](https://img.shields.io/badge/support%20me-on%20patreon-fa7664.svg)](https://patreon.com/derhuerst)


## installing & running

`bvg-rest` expects a [Redis](https://redis.io/) server running on `127.0.0.1:6379` (default port), but you can set the `REDIS_URL` environment variable to change this.

### via Docker

A Docker image [is available as `derhuerst/db-rest:5`](https://hub.docker.com/r/derhuerst/db-rest:5).

```shell
docker run -d -p 3000:3000 derhuerst/db-rest:5
```

*Note:* The Docker image does not contain the Redis server.

### manually

```shell
git clone https://github.com/derhuerst/db-rest.git
cd db-rest
git checkout 5
npm install --production

redis-server &
npm start
```

To keep the API running permanently, use tools like [`forever`](https://github.com/foreverjs/forever#forever) or [`systemd`](https://wiki.debian.org/systemd).


## Related Projects

- [`vbb-rest`](https://github.com/derhuerst/vbb-rest) – A clean REST API wrapping around the VBB API.
- [`bvg-rest`](https://github.com/derhuerst/bvg-rest) – A clean REST API wrapping around the BVG API.
- [`hvv-rest`](https://github.com/derhuerst/hvv-rest) – A clean REST API wrapping around the HVV API.
- [`hafas-rest-api`](https://github.com/public-transport/hafas-rest-api) – Expose a HAFAS client via an HTTP REST API.
- [`hafas-client`](https://github.com/public-transport/hafas-client) – JavaScript client for HAFAS public transport APIs.


## Contributing

If you **have a question**, **found a bug** or want to **propose a feature**, have a look at [the issues page](https://github.com/derhuerst/db-rest/issues).
