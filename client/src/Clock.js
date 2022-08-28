import React from 'react'
import format from 'date-fns/format'
import './Clock.css'

class Clock extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      error: null,
      isLoaded: false,
      date: new Date()
    }
  }

  componentDidMount() {
    let timer = 1000
    this.timerID = setInterval(() => this.tick(), timer)
  }

  componentWillUnmount() {
    clearInterval(this.timerID)
  }

  render() {
    return (
      <div className="clock">
        <h2 className="clock_time">{format(this.state.date, 'h:mm aa')}</h2>
        <h2 className="clock_date">
          {format(this.state.date, 'EEEE, LLLL Mo u')}
        </h2>
      </div>
    )
  }

  tick() {
    this.setState({
      date: new Date()
    })
  }
}

export default Clock
