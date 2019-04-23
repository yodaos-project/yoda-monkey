# Yoda-monkey
Monkey script for YODAOS automatic performance test.

## Usage
```shell
$ adb push ./yoda-monkey.js /data
$ adb shell
$ cd /data
$ chmod +x ./yoda-monkey.js
$ ./yoda-monkey.js
```

## How to add a new monkey
1. Open yoda-monkey.js.
2. Add a new line to actions(start at line 11): ` [$method, $param, $sleep],`, don't forget the last comma.

## Fileds descrption
- $method: one of `['mockAsr', 'mockKeyboard']`.
- $param: argument for $method.
- $sleep: sleep time in seconds after executed the method.

## Sample
```js
...

var actions = [
  ['mockAsr', '音量到百分之一', 2],
  ['mockAsr', '音量到百分之二十', 2],
  ['mockAsr', '我要听歌', 5],
  ['mockKeyboard', '{ "event": "keydown", "keyCode": 114 }', 2],
]

...
```
