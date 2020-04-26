# db-rest

**A clean REST API wrapping around the [Deutsche Bahn](https://en.wikipedia.org/wiki/Deutsche_Bahn) [API](https://github.com/public-transport/db-hafas#db-hafas).**

[API Documentation](docs/index.md) | [Why?](docs/why.md)

![db-rest architecture diagram](architecture.svg)

[![Docker build status](https://img.shields.io/docker/build/derhuerst/db-rest.svg)](https://hub.docker.com/r/derhuerst/db-rest/)
[![dependency status](https://img.shields.io/david/derhuerst/db-rest.svg)](https://david-dm.org/derhuerst/db-rest)
![ISC-licensed](https://img.shields.io/github/license/derhuerst/db-rest.svg)
[![gitter channel](https://badges.gitter.im/derhuerst/db-rest.svg)](https://gitter.im/derhuerst/db-rest)
[![support me on Patreon](https://img.shields.io/badge/support%20me-on%20patreon-fa7664.svg)](https://patreon.com/derhuerst)


## installing & running

### via Docker

A Docker image [is available as `derhuerst/db-rest`](https://hub.docker.com/r/derhuerst/db-rest).

```shell
docker run -d -p 3000:3000 derhuerst/db-rest
```

### manually

```shell
git clone https://github.com/derhuerst/db-rest.git
cd db-rest
git checkout 2
npm install --production
npm start
```

To keep the API running permanently, use tools like [`forever`](https://github.com/foreverjs/forever#forever) or [`systemd`](https://wiki.debian.org/systemd).


## Contributing

If you **have a question**, **found a bug** or want to **propose a feature**, have a look at [the issues page](https://github.com/derhuerst/db-rest/issues).
