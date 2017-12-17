# TaskQueue17

a queue to ensure async functions are called one after another in order, with option to run some functions in parallel

## How to use

TaskQueue17 has one main method: `#push(fn[, group])`
It is a async function which expects an async function, describing the task, as its first parameter.
The second parameter is a group identifier.
Normally all tasks in the queue will run sequentially.
But consecutive tasks with the same (`===`) group will be running in parallel.
If no group is specified, `null` is assumed.
A `null` group will always run on its own.

You can pause the queue with `#pause()` and resume it with `#resume()`.
You can get the current pause-state with `#isPaused()`.
The queue starts unpaused.

## Example

```JavaScript
const TaskQueue = require('taskqueue17')
const taskQueue = new TaskQueue()

const taskA = taskQueue.push(async () => {
  console.log('I run alone! (1)')
})

const taskB = taskQueue.push(async () => {
  console.log('We run together! (2)')
}, 0)

const taskC = taskQueue.push(async () => {
  console.log('We run together! (3)')
}, 0)

const taskD = taskQueue.push(async () => {
  console.log('I run alone! (4)')
})

Promise.all([
  taskA,
  taskB,
  taskC,
  taskD
]).then(() => {
  console.log('All tasks done!')
}).catch(error => {
  console.error('At least one task failed!', error)
})
```
