const express = require("express");
const axios = require("axios");
const SpotifyWebApi = require("spotify-web-api-node");
const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 0, checkperiod: 30 });
const Vibrant = require("node-vibrant");
const tinycolor = require("tinycolor2");
const chalk = require("chalk");
const cfg = require("./config.json");

require("dotenv").config();

if (!cfg.spotifyClientID) {
  cfg.spotifyClientID = process.env.SPOTIFY_CLIENT_ID;
}

if (!cfg.spotifyClientSecret) {
  cfg.spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;
}

const app = express();

if (!cfg.prod) {
  // CORS for local dev
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", cfg.app); // update to match the domain you will make the request from
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
  });
}

app.use((req, res, next) => {
  console.log(`${req.method}: ${req.originalUrl}`);
  next();
});

// Configuring body parser middleware
app.use(express.json());

app.get("/login", function (req, res) {
  var state = generateRandomString(16);

  parms = new URLSearchParams({
    response_type: "code",
    client_id: cfg.spotifyClientID,
    scope: cfg.spotifyScope,
    redirect_uri: cfg.redirectURL,
    state: state,
  });

  url = `https://accounts.spotify.com/authorize?${parms}`;

  res.redirect(url);
});

app.get("/callback", function (req, res) {
  var code = req.query.code || null;
  var state = req.query.state || null;

  if (state === null) {
    res.redirect(
      "/#" +
        querystring.stringify({
          error: "state_mismatch",
        })
    );
  } else {
    axios({
      url: "https://accounts.spotify.com/api/token",
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(
            cfg.spotifyClientID + ":" + cfg.spotifyClientSecret
          ).toString("base64"),
      },
      data: new URLSearchParams({
        code: code,
        redirect_uri: cfg.redirectURL,
        grant_type: "authorization_code",
      }),
    }).then((resp) => {
      success = cache.set(
        "access_token",
        resp.data.access_token,
        resp.data.expires_in
      );
      success = cache.set("refresh_token", resp.data.refresh_token);
      res.redirect(cfg.app);
    });
  }
});

app.get("/api/playing", (req, res) => {
  getToken().then(
    (token) => {
      var spotifyApi = new SpotifyWebApi();
      spotifyApi.setAccessToken(token);

      spotifyApi.getMyCurrentPlaybackState().then(
        (data) => {
          if (data.statusCode != 200) {
            res.json({
              isPlaying: false,
              artist: null,
              album: null,
              image: {},
              track: null,
              device: null,
              colourPalette: {
                text: "dark",
              },
            });
            return;
          }

          Vibrant.from(data.body.item.album.images[0].url)
            .quality(1)
            .clearFilters()
            .getPalette()
            .then((palette) => {
              var p = {
                text: "dark",
              };
              if (data.body.is_playing) {
                let albumColours = Object.keys(palette)
                  .filter((item) => {
                    return item === null ? null : item;
                  })
                  .map((colour) => {
                    return {
                      background: palette[colour].hex,
                    };
                  });

                p =
                  albumColours[Math.floor(Math.random() * albumColours.length)];
                var color = tinycolor(p.background);
                p.text = "dark";
                if (color.isDark()) {
                  p.text = "light";
                }
              }

              res.json({
                id: data.body.item.id,
                isPlaying: data.body.is_playing,
                artist: data.body.item.artists[0].name,
                album: data.body.item.album.name,
                image: data.body.item.album.images[0],
                track: data.body.item.name,
                device: {
                  name: data.body.device.name,
                  restricted: data.body.device.is_restricted,
                },
                colourPalette: p,
              });
            });
        },
        (err) => {
          returnError(res, err);
        }
      );
    },
    (err) => {
      returnError(res, err);
    }
  );
});

app.get("/api/play", (req, res) => {
  token = cache.get("access_token");
  var spotifyApi = new SpotifyWebApi();
  spotifyApi.setAccessToken(token);

  spotifyApi.play().then(
    () => {
      res.json({
        success: true,
      });
    },
    (err) => {
      returnError(res, err);
    }
  );
});

app.get("/api/pause", (req, res) => {
  token = cache.get("access_token");
  var spotifyApi = new SpotifyWebApi();
  spotifyApi.setAccessToken(token);

  spotifyApi.pause().then(
    () => {
      res.json({
        success: true,
      });
    },
    (err) => {
      returnError(res, err);
    }
  );
});

app.get("/api/next", (req, res) => {
  token = cache.get("access_token");
  var spotifyApi = new SpotifyWebApi();
  spotifyApi.setAccessToken(token);

  spotifyApi.skipToNext().then(
    () => {
      res.json({
        success: true,
      });
    },
    (err) => {
      returnError(res, err);
    }
  );
});

app.get("/api/previous", (req, res) => {
  token = cache.get("access_token");
  var spotifyApi = new SpotifyWebApi();
  spotifyApi.setAccessToken(token);

  spotifyApi.skipToPrevious().then(
    () => {
      res.json({
        success: true,
      });
    },
    (err) => {
      returnError(res, err);
    }
  );
});

app.get("/", function (req, res) {
  res.sendFile("client/build/index.html", { root: __dirname });
});

app.use(express.static("client/build"));

app.listen(cfg.port, () => {
  console.log(`Example app listening on port ${cfg.port}`);
});

function returnError(res, err) {
  console.log("Something went wrong!", err);

  if (
    err.body &&
    err.body.error &&
    err.body.error.reason === "NO_ACTIVE_DEVICE"
  ) {
    res.status(502).json({
      success: false,
      message: "No active Spotify device found",
    });
  } else if (err.statusCode == 401) {
    res.json({
      redirect: cfg.loginURL,
    });
  } else {
    var message;
    if (err.body && err.body.error) {
      message = err.body.error.message;
    }

    res.status(500).json({
      success: false,
      message,
    });
  }
}

function getToken() {
  return new Promise((resolve, reject) => {
    console.log("Getting token");
    token = cache.get("access_token");

    if (token) {
      resolve(token);
      return;
    }

    refreshToken().then(
      (tkn) => {
        resolve(tkn);
      },
      (err) => {
        reject(err);
      }
    );
  });
}

function refreshToken() {
  return new Promise((resolve, reject) => {
    token = cache.get("refresh_token");

    console.log(chalk.green("Refreshing token"));

    if (!token) {
      console.log(
        chalk.green("refresh_token has: " + cache.has("refresh_token"))
      );
      reject({
        statusCode: 401,
        message: "Refresh token not found.",
      });
      return;
    }

    axios({
      url: "https://accounts.spotify.com/api/token",
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(
            cfg.spotifyClientID + ":" + cfg.spotifyClientSecret
          ).toString("base64"),
      },
      data: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token,
      }),
    }).then((data) => {
      data = JSON.parse(data);
      success = cache.set("access_token", data.access_token, data.expires_in);
      success = cache.set("refresh_token", data.refresh_token, 0);
      resolve(data.access_token);
    });
  });
}

function generateRandomString(length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
