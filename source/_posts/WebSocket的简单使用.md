---
title: WebSocket的简单使用
date: 2018-05-09 10:59:51
tags: Java
category: code
---
#### 简介
&emsp;WebSocket协议在2008年诞生，2011年成为国际标准，所有浏览器都已经支持了。它的最大特点就是，服务器可以主动向客户端推送消息，客户端也可以主动向服务器端发送消息，是真正的双向平等对话，属于服务器推送技术的一种。
其他特点包括：
1. 建立在TCP协议之上，服务器端的实现比较容易。
2. 与HTTP协议有着良好的兼容性，默认端口也是80和443，并且握手阶段采用HTTP协议，因此握手时不容易屏蔽，能通过各种HTTP代理服务器。
3. 数据格式比较轻量，性能开销小，通信高效。
4. 可以发送文本，也可以发送二进制数据。
5. 没有同源限制，客户端可以与任何服务器通信。
6. 协议表示符是ws（如果加密，则为wss），服务器网址就是URL。
#### 客户端的简单示例
WebSocket的用法相当简单。下面是一个网页脚本的例子：
```js
var ws = new WebSocket("wss://echo.websocket.org");
ws.onopen = function(e){
    console.log("Connection open ...");
    ws.send("Hello WebSockets!");
};

ws.onmessage = function(e){
    console.log("Received Message: "+e.data);
    ws.close();
};

ws.onclose = function(e){
    console.log("Connection closed.");
}
```
#### 客户端的API
##### WebSocket构造函数
WebSocket对象作为一个构造函数，用于新建WebSocket实例。
```js
var ws = new WebSocket("ws://localhost:8000");
```
执行上面语句之后，客户端就会与服务器进行连接。
实例对象的所有属性和方法清单，参见[这里](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)。
##### webSocket.readyState
readyState属性返回实例对象的当前状态，共有四种。
- CONNECTING: 值为0，表示正在连接。
- OPEN: 值为1，表示连接成功，可以通信了。
- CLOSEING: 值为2，表示连接正在关闭。
- CLOSED: 值为3，表示连接已经关闭，或者打开连接失败。
下面是一个实例。
```js
switch(ws.readyState){
    case WebSocket.CONNECTING:
        // do something
        break;
    case WebSocket.OPEN:
        // do something
        break;
    case WebSocket.CLOSING:
        // do something
        break;
    case WebSocket.CLOSED:
        //do something
        break;
    default:
        // this never happens
        break;
}
```
##### webSocket.onopen
实例对象的onopen属性，用于指定连接成功后的回调函数。
```js
ws.onopen = function(){
    ws.send('Hello Server!');
}
```
如果指定多个回调函数，可以使用addEventListener方法。
```js
ws.addEventListener('open',function(e){
    ws.send('Hello Server!');
});
```
##### webSocket.onclose
实例对象的onclose属性，用于指定连接关闭后的回调函数。
```js
ws.onclose = function(e){
    var code = e.code;
    var reason = e.reason;
    var wasClean = e.wasClean;
    //handle close event
}
ws.addEventListener("close",function(e){
    var code = e.code;
    var reason = e.reason;
    var wasClean = e.wasClean;
    //handle close event
})
```
##### webSocket.onmessage
实例对象的onmessage属性，用于指定收到服务器数据后的回调函数。
```js
ws.onmessge = function(e){
    var data = e.data;
    //处理数据
};
ws.addEventListener("message",function(e){
    var data = e.data;
    //处理数据
});
```
注意，服务器数据可能是文本，也可能是二进制数据（blob对象或Arraybuffer对象）。
```js
ws.onmessage = function(e){
    if(typeof e.data === String) {
        console.log("Received data string");
    }

    if(e.data instanceof ArrayBuffer){
        var buffer = e.data;
        console.log("Received arraybuffer");
    }
}
```
除了动态判断收到的数据类型，也可以使用binaryType属性，显示指定收到的二进制数据类型。
```js
//收到的时blob数据
ws.binaryType = "blob";
ws.onmessage = function(e){
    console.log(e.data.size);
};
//收到的是ArrayBuffer数据
ws.binaryType = "arraybuffer";
ws.onmessage = function(e){
    console.log(e.data.byteLength);
};
```
##### webSocket.send()
实例对象的send()方法用于想向服务其发送数据。
发送文本的例子。
```js
ws.send("your message");
```
发送Blob对象的例子。
```js
var file = document
    .querySelector('input[type="file"]')
    .files[0];
ws.send(file);
```
发送ArrayBuffer对象的例子。
```js
//Sending canvas ImageData as ArrayBuffer
var img = canvas_context.getImageData(0,0,400,320);
var binary = new Uint8Array(img.data.length);
for(var i = 0; i < img.data.length; i++){
    binary[i] = img.data[i];
}
ws.send(binary.buffer);
```
##### webSocket.bufferedAmount
实例对象的bufferedAmount属性，表示还有多少字节的二进制数据没有发送出去。它可以用来判断发送是否结束。
```js
var data = new ArrayBuffer(10000000);
socket.send(data);
if(socket.bufferedAmount === 0){
    // 发送完毕
}else{
    // 发送还没结束
}
```
##### webSocket.onerror
实例对象的onerror属性，用于指定报错时的回调函数。
```js
socket.onerror = function(e){
    //handle error event
};
socket.addEventListener("error",function(event){
    //handle error event
})
```