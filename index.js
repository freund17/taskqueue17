const wait = delay => new Promise(resolve => setTimeout(resolve, delay))

class TaskQueue {
  constructor () {
    this._tasks = []
    this._runningCount = 0
    this._busy = false
    this._paused = false
  }

  _push (task) {
    this._tasks.push(task)
    this._handleTasks()
  }

  _pop () {
    return this._tasks.shift()
  }

  _peek () {
    return this._tasks[0]
  }

  size () {
    return this._tasks.length + this._runningCount
  }

  pause () {
    this._paused = true
  }

  resume () {
    this._paused = false
    this._handleTasks()
  }

  isPaused () {
    return this._paused
  }

  async _handleTasks () {
    await wait(0)

    if (this._busy || this._paused || this.size() === 0) {
      return
    }

    this._busy = true

    const tasks = []
    tasks.push(this._pop())

    while (this.size() > 0) {
      let candidate = this._peek()

      if (candidate.group === null || candidate.group !== tasks[0].group) {
        break
      }

      tasks.push(candidate)
      this._pop()
    }

    const runner = tasks.map(({ fn, resolve, reject }) => (async () => {
      ++this._runningCount

      try {
        const response = await fn()
        --this._runningCount
        resolve(response)
      } catch (error) {
        --this._runningCount
        reject(error)
      }
    })())

    await Promise.all(runner)

    this._busy = false
    await this._handleTasks()
  }

  async push (fn, group) {
    if (typeof group === 'undefined') {
      group = null
    }

    return new Promise((resolve, reject) => {
      const task = { fn, group, resolve, reject }

      this._push(task)
    })
  }
}

module.exports = TaskQueue
