const wait = delay => new Promise(resolve => setTimeout(resolve, delay))

/**
 * a queue to ensure async functions are called one after another in order, with option to run some functions in parallel
 */
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

  /**
   * @returns the size of the queue, including already running tasks
   */
  size () {
    return this._tasks.length + this._runningCount
  }

  /**
   * pauses the queue, no new tasks will get started after this
   */
  pause () {
    this._paused = true
  }

  /**
   * resumes the queue
   */
  resume () {
    this._paused = false
    this._handleTasks()
  }

  /**
   * @returns the current pause state
   */
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

  /**
   * Pushes a new function onto the task-stack
   * @param {function} fn the async function to push
   * @param {String|Number} [group] the group identifier, consecutive tasks with the same group will be run in parallel
   * @returns a Promise that resolves the way fn would have resolved
   */
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
