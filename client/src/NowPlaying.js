import React from "react";
import "./NowPlaying.css";

class NowPlaying extends React.Component {
  render() {
    return (
      <div className="now-playing">
        <div className="now-playing_cover">
          <img
            src={this.props.player.image.url}
            alt={`${this.props.player.album}`}
          />
        </div>
        <div className="now-playing_details">
          <h1 className="now-playing_track">{this.props.player.track}</h1>
          <h2 className="now-playing_artists">{this.props.player.artist}</h2>
          <h3 className="now-playing_album">{this.props.player.album}</h3>
          <h4 className="now-playing_device">
            Listening on {this.props.player.device.name}
            {this.props.player.device.restricted && <span> (restricted)</span>}
          </h4>
        </div>
      </div>
    );
  }
}

export default NowPlaying;
