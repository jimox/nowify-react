import React from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.min.css";
import Clock from "./Clock";
import Controls from "./Controls";
import NowPlaying from "./NowPlaying";
import "./App.css";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      isLoaded: false,
      checkingStatus: false,
      player: {
        image: {},
        colourPalette: {
          textColor: "#000000",
        },
        device: {},
      },
    };

    // This binding is necessary to make `this` work in the callback
    this.play = this.play.bind(this);
    this.pause = this.pause.bind(this);
    this.next = this.next.bind(this);
    this.previous = this.previous.bind(this);
  }

  componentDidMount() {
    this.playing();
    let timer = 5000;
    this.timerID = setInterval(() => this.playing(), timer);
  }

  componentWillUnmount() {
    clearInterval(this.timerID);
  }

  render() {
    var toastId = "err-msg-toast";
    var notify = () => {};
    if (this.state.errMessage) {
      notify = () => {
        toast(this.state.errMessage, {
          toastId,
        });
      };
    }

    if (!this.state.isLoaded) {
      return (
        <div className="app">
          <Clock />
          <div className="now-playing">
            <h1 className="now-playing_idle-heading">
              Loading
              <span
                className="now-playing_idle-emoji"
                role="img"
                aria-label="sad"
              >
                🎵
              </span>
            </h1>
          </div>
          <Controls
            player={this.state.player}
            onPause={this.pause}
            onPlay={this.play}
            onNext={this.next}
            onPrevious={this.previous}
          />
          <ToastContainer
            position="top-center"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
          {notify()}
        </div>
      );
    }

    if (!this.state.player.isPlaying) {
      return (
        <div className="app">
          <Clock />
          <div className="now-playing">
            <h1 className="now-playing_idle-heading" onClick={this.play}>
              No music is playing
              <span
                className="now-playing_idle-emoji"
                role="img"
                aria-label="sad"
              >
                😔
              </span>
            </h1>
          </div>
          <Controls
            player={this.state.player}
            onPause={this.pause}
            onPlay={this.play}
            onNext={this.next}
            onPrevious={this.previous}
          />
          <ToastContainer
            position="top-center"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
          {notify()}
        </div>
      );
    }

    return (
      <div
        className="app"
        style={{
          backgroundColor: this.state.player.colourPalette.background,
          color: this.state.player.colourPalette.textColor,
        }}
      >
        <Clock />
        <NowPlaying player={this.state.player} />
        {!this.state.player.device.restricted && (
          <Controls
            player={this.state.player}
            onPause={this.pause}
            onPlay={this.play}
            onNext={this.next}
            onPrevious={this.previous}
          />
        )}
        <ToastContainer
          position="top-center"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        {notify()}
      </div>
    );
  }

  play() {
    fetch("/api/play")
      .then((res) => {
        if (!res.ok) {
          return res.json().then((body) => {
            this.setState({
              errMessage: body.message,
            });
            throw new Error("stop");
          });
        } else {
          return res.json();
        }
      })
      .then(
        (data) => {
          if (data.success) {
            this.playing();
          } else if (data.message) {
            this.setState({
              errMessage: data.message,
            });
          }
        },
        (err) => {
          console.log(err);
        }
      );
  }

  pause() {
    fetch("/api/pause")
      .then((res) => {
        if (!res.ok) {
          return res.json().then((body) => {
            this.setState({
              errMessage: body.message,
            });
            throw new Error("stop");
          });
        } else {
          return res.json();
        }
      })
      .then((data) => {
        if (data.success) {
          this.setState({
            player: {
              isPlaying: false,
              colourPalette: {
                textColor: "#000000",
              },
            },
          });
        }
      })
      .catch(() => {
        // swallow
        return;
      });
  }

  next() {
    fetch("/api/next")
      .then((res) => {
        if (!res.ok) {
          return res.json().then((body) => {
            this.setState({
              errMessage: body.message,
            });
            throw new Error("stop");
          });
        } else {
          return res.json();
        }
      })
      .then((data) => {
        if (data.success) {
          this.playing();
        }
      });
  }

  previous() {
    fetch("/api/previous")
      .then((res) => {
        if (!res.ok) {
          return res.json().then((body) => {
            this.setState({
              errMessage: body.message,
            });
            throw new Error("stop");
          });
        } else {
          return res.json();
        }
      })
      .then((data) => {
        if (data.success) {
          this.playing();
        }
      });
  }

  playing() {
    if (this.state.checkingStatus) {
      return;
    }

    this.setState({
      checkingStatus: true,
      errMessage: null,
    });

    fetch("/api/playing")
      .then((res) => {
        if (!res.ok) {
          return res.json().then((body) => {
            this.setState({
              errMessage: body.message,
            });
            throw new Error("stop");
          });
        } else {
          return res.json();
        }
      })
      .then(
        (result) => {
          this.setState({
            checkingStatus: false,
          });

          if (result.redirect) {
            window.location.replace(result.redirect);
            return null;
          }

          if (
            this.state.player.isPlaying &&
            result.isPlaying &&
            this.state.player.id === result.id &&
            this.state.player.device.name === result.device.name
          ) {
            return;
          }

          result.colourPalette.textColor =
            result.colourPalette.text === "light" ? "#FFFFFF" : "#000000";

          this.setState({
            isLoaded: true,
            player: result,
          });
        },
        // Note: it's important to handle errors here
        // instead of a catch() block so that we don't swallow
        // exceptions from actual bugs in components.
        (error) => {
          console.log(error);
          this.setState({
            checkingStatus: false,
            isLoaded: true,
            error,
          });
        }
      );
  }
}

export default App;
