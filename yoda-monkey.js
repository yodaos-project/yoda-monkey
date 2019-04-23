#!/usr/bin/env iotjs
/**
 * 如果需要新增 mock 请在 actions 内添加下面一行：
 * [$method, $param, $sleep],
 * $method: 为 mockAsr 或者 mockKeyboard
 * $param 为 method 的参数
 * $sleep 为执行完 mock 后休眠时间，单位秒
 * 最后的逗号是必须的
 */
var actions = [
  ['mockAsr', '音量到百分之一', 2],
  ['mockAsr', '音量到百分之二十', 2],
  ['mockAsr', '我要听歌', 5],
  ['mockKeyboard', '{ "event": "keydown", "keyCode": 114 }', 2],
]

require('os').setPriority(-20)
var exec = require('child_process').exec
var dbus = require('dbus').getBus('session')
var _ = require('@yoda/util')._
var iface = null
var actionsIndex = 0
var timer = null
var mockTimes = 0

if (actions.length <= actionsIndex) {
  console.error('Error: actions is empty.')
  process.exit(1)
}

var dbusInterfaceCallback = _.once(onGetDbusInterface)
setTimeout(
  dbusInterfaceCallback.bind(null, new Error('DBus iface Timeout.')),
  15 * 1000
)

timer = dbus.getInterface(
  'com.rokid.AmsExport',
  '/rokid/yoda/debug',
  'rokid.yoda.Debug',
  dbusInterfaceCallback
)

function onGetDbusInterface(err, dbusIface) {
  clearTimeout(timer)
  if (err) {
    console.error('Error: Dbus interface error.', err)
    return process.exit(1)
  }
  if (dbusIface == null) {
    console.error('Error: VuiDaemon is not ready, try again later.')
    return process.exit(1)
  }
  iface = dbusIface
  mockAction()
}

function mockAction() {
  if (actionsIndex >= actions.length) {
    actionsIndex = 0
  }
  if (actionsIndex === 0) {
    ++mockTimes
    console.log(`Mock times: ${mockTimes}, time: ${new Date()}.`)
    exec('free -m', function (err, stdout, stderr) {
      if (err) {
        console.error('Error: execute free error.', err)
      } else if (stderr) {
        console.error(`Error: print free error ${stderr}`)
      } else {
        console.log(stdout)
      }
      doMock()
    })
  } else {
    doMock()
  }
}

function doMock() {
  var action = actions[actionsIndex++]
  if (action.length < 3) {
    console.error(`Error: action ${actionsIndex} is invalid.`, action)
    setTimeout(mockAction, 1 * 1000)
    return
  }
  var method = action[0]
  var param = action[1]
  var sleep = (typeof action[2] === 'number' ? action[2] : 1) * 1000
  if (typeof iface[method] !== 'function') {
    console.error(`Error: '${method}' is not implemented in YodaRT, ` +
      'try install a newer version of YodaRT and try again.')
    setTimeout(mockAction, sleep)
    return
  }
  console.log(`Method: ${method}, Param: ${param}, Timeout: ${sleep}ms`)
  var cb = _.once(function (err, result) {
    clearTimeout(timer)
    do {
      if (err) {
        console.error('Unexpected error on mock:', err && err.message)
        console.error(err && err.stack)
        break
      }
      var data
      try {
        data = JSON.parse(result)
      } catch (err) {
        console.error('Failed to parse result from VuiDaemon:', result)
        break
      }
      console.log('Ok:', data.ok === true)
      if (data.ok !== true) {
        console.log('Error:', data.message)
        console.log('Stack:', data.stack)
        break
      }
      // console.log('Result:', JSON.stringify(data.result, null, 2))
    } while (false)
    setTimeout(mockAction, sleep)
  })
  iface[method](param, cb)
  timer = setTimeout(
    cb.bind(null, new Error('DBus method timeout.')),
    10 * 1000
  )
}
