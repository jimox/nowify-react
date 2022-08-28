import React from 'react'
import './Controls.css'

class Controls extends React.Component {
  render() {
    var play = this.props.onPlay
    var playText = 'play_arrow'
    if (this.props.player.isPlaying) {
      play = this.props.onPause
      playText = 'pause'
    }

    return (
      <div className="controls">
        <span
          className="material-icons-round md-48"
          style={{
            color: this.props.player.colourPalette.textColor
          }}
          onClick={this.props.onPrevious}
        >
          skip_previous
        </span>
        <span
          className="material-icons-round md-48"
          style={{
            color: this.props.player.colourPalette.textColor
          }}
          onClick={play}
        >
          {playText}
        </span>
        <span
          className="material-icons-round md-48"
          style={{
            color: this.props.player.colourPalette.textColor
          }}
          onClick={this.props.onNext}
        >
          skip_next
        </span>
      </div>
    )
  }
}

export default Controls
