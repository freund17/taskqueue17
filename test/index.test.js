/* global describe, it */

const assert = require('chai').assert
const TaskQueue = require('../index')
const wait = delay => new Promise(resolve => setTimeout(resolve, delay))

describe('TaskQueue', function () {
  it('returns the correct number tasks in queue, including currently running', async function () {
    const taskQueue = new TaskQueue()

    assert.strictEqual(taskQueue.size(), 0)
    const task = taskQueue.push(async () => { await wait(5) })
    await wait(1)
    assert.strictEqual(taskQueue.size(), 1)
    await task
    assert.strictEqual(taskQueue.size(), 0)
  })

  it('returns the correct paused-state', async function () {
    const taskQueue = new TaskQueue()

    assert.strictEqual(taskQueue.isPaused(), false)
    taskQueue.pause()
    assert.strictEqual(taskQueue.isPaused(), true)
    taskQueue.resume()
    assert.strictEqual(taskQueue.isPaused(), false)
  })

  it('runs tasks that got pushed on the queue', async function () {
    const taskQueue = new TaskQueue()
    let result = false

    await taskQueue.push(async () => {
      result = true
    })

    assert.isTrue(result)
  })

  it('forwards the result of a task', async function () {
    const taskQueue = new TaskQueue()
    const expectedResult = 'ABC'

    const result = await taskQueue.push(async () => {
      return expectedResult
    })

    assert.strictEqual(result, expectedResult)
  })

  it('forwards the error of a task', async function () {
    const taskQueue = new TaskQueue()
    const expectedError = new Error('EFG')

    try {
      await taskQueue.push(async () => {
        throw expectedError
      })

      throw new Error('failed test')
    } catch (error) {
      assert.strictEqual(error, expectedError)
    }
  })

  it('runs tasks sharing the same group simultaneously', async function () {
    const taskQueue = new TaskQueue()
    let simCounter = 0
    let ok = false
    const task = async () => {
      ++simCounter

      if (simCounter === 4) {
        ok = true
      }

      await wait(5)

      --simCounter
    }

    await Promise.all([
      taskQueue.push(task, 0),
      taskQueue.push(task, 0),
      taskQueue.push(task, 0),
      taskQueue.push(task, 0)
    ])

    assert.isTrue(ok)
  })

  it('runs tasks not sharing the same group successively', async function () {
    const taskQueue = new TaskQueue()
    let simCounter = 0
    const task = async () => {
      ++simCounter

      if (simCounter > 1) {
        throw new Error('failed!')
      }

      await wait(5)

      --simCounter
    }

    await Promise.all([
      taskQueue.push(task),
      taskQueue.push(task),
      taskQueue.push(task),
      taskQueue.push(task)
    ])
  })

  it('runs tasks sharing the same group simultaneously and runs tasks not sharing the same group successively', async function () {
    const taskQueue = new TaskQueue()
    let simCounter = 0
    let ok = false
    const taskA = async () => {
      ++simCounter

      if (simCounter > 1) {
        ok = true
      }

      await wait(5)

      --simCounter
    }
    const taskB = async () => {
      ++simCounter

      if (simCounter > 1) {
        throw new Error('failed!')
      }

      await wait(5)

      --simCounter
    }

    await Promise.all([
      taskQueue.push(taskA, 0),
      taskQueue.push(taskA, 0),
      taskQueue.push(taskB),
      taskQueue.push(taskB),
      taskQueue.push(taskA, 0),
      taskQueue.push(taskB)
    ])

    assert.isTrue(ok)
  })

  it('delays tasks while paused and resume tasks when resumed', async function () {
    const taskQueue = new TaskQueue()
    let actions = 0
    const task = async () => {
      ++actions
    }

    taskQueue.pause()
    const taskA = taskQueue.push(task)

    await wait(5)
    assert.strictEqual(actions, 0)

    const taskB = taskQueue.push(task)
    taskQueue.resume()

    await Promise.all([
      taskA,
      taskB
    ])

    assert.strictEqual(actions, 2)
  })
})
