---
title: WebSocket的java简单应用
date: 2018-05-10 09:16:22
tags: [Java]
category: code
---
&emsp;java中要使用websocket，首先要引入tomcat中的websocket-api.jar,服务器端代码如下：
```java
import javax.websocket.*;
import javax.websocket.server.PathParam;
import javax.websocket.server.ServerEndpoint;
import java.io.IOException;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.concurrent.ConcurrentHashMap;

/**
 * @ServerEndPoint 注解是一个类层次的注解，它的功能主要是将目前的类定义成一个websocket服务端，
 *  注解的值将用于监听用户连接的终端访问URL地址，客户端可以通过这个URL来连接WebSocket服务器端
 *  @ServerEndPoint 可以将当前类变成websocket服务类
 */
@ServerEndpoint("/websocket/{userno}")
public class WebSocketTest {
    //静态变量，用来记录当前在线连接数。应该把它设计成线程安全的。
    private static int onlineCount = 0;
    //concurrent 包的线程安全Set，用来存放每个客户端对应的MyWebSocket对象。若要实现服务端与单一客户端通信的话，可以使用Map来存放，其中key可以为用户标识
    private static ConcurrentHashMap<String, WebSocketTest> webSocketSet = new ConcurrentHashMap<String, WebSocketTest>();
    //与某个客户端的连接会话，需要通过他来给客户端发送数据
    private Session webSocketSession;
    //当前发消息的人员编号
    private String userno = "";

    /**
     * 连接建立成功调用的方法
     *
     * @param webSocketSession 可选的参数。session为与某个客户端的连接会话，需要通过他来给客户端发送数据
     */
    @OnOpen
    public void onOpen(@PathParam(value = "userno")String param, Session webSocketSession, EndpointConfig config){
        System.out.println(param);
        userno = param; //接收到发送消息的人员编号
        this.webSocketSession = webSocketSession;
        webSocketSet.put(param,this);
        addOnlineCount();
        System.out.println("有新连接加入！当前在线人数为"+getOnlineCount());
    }

    /**
     * 收到客户端消息后调用的方法
     */
    @SuppressWarnings("unused")
//    @OnMessage
    public void onMessage(String message,Session session){
        System.out.println("来自客户端的消息："+message);
        //群发消息
        if(1 < 2){
            sendAll(message);
        }else{
            //给指定的人发消息
            sendToUser(message);
        }
    }

    /**
     * 给指定的人发送消息
     */
    @OnMessage
    public void sendToUser(String message) {
        System.out.println(message);
        String sendUserno = message.split("[|]")[1];
        String sendMessage = message.split("[|]")[0];
        String now = getNowTime();
        try {
            if (webSocketSet.get(sendUserno) != null) {
                webSocketSet.get(sendUserno).sendMessage(now + "用户" + userno + "发来消息：" + "<br/>" + sendMessage);
            }else{
            System.out.println("当前用户不在线");
        }
    }catch (IOException e) {
            e.printStackTrace();
        }
    }
    /**
     * 给所有人发消息
     * @param message
     */
    private void sendAll(String message) {
        String now = getNowTime();
        String sendMessage = message.split("[|]")[0];
        //遍历HashMap
        for (String key : webSocketSet.keySet()) {
            try {
                //判断接收用户是否是当前发消息的用户
                if (!userno.equals(key)) {
                    webSocketSet.get(key).sendMessage(now + "用户" + userno + "发来消息：" + " <br/> " + sendMessage);
                    System.out.println("key = " + key);
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }




    /**
     * 获取当前时间
     *
     * @return
     */
    private String getNowTime() {
        Date date = new Date();
        DateFormat format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        String time = format.format(date);
        return time;
    }
    /**
     * 发生错误时调用
     *
     * @param session
     * @param error
     */
    @OnError
    public void onError(Session session, Throwable error) {
        System.out.println("发生错误");
        error.printStackTrace();
    }


    /**
     * 这个方法与上面几个方法不一样。没有用注解，是根据自己需要添加的方法。
     *
     * @param message
     * @throws IOException
     */
    public void sendMessage(String message) throws IOException {
        this.webSocketSession.getBasicRemote().sendText(message);
        //this.session.getAsyncRemote().sendText(message);
    }


    public static synchronized int getOnlineCount() {
        return onlineCount;
    }


    public static synchronized void addOnlineCount() {
        WebSocketTest.onlineCount++;
    }


    public static synchronized void subOnlineCount() {
        WebSocketTest.onlineCount--;
    }

}
```
然后是前台页面，前台使用的是jsp
```jsp
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<html>
  <head>
    <title>Java后端WebSocket的Tomcat实现</title>
  </head>
  <body>
    Welcome<br/><input id="text" type="text"/>
    <button onclick="send()">发送消息</button>
    <hr/>
  <%--userno:发送消息人的编号--%>
  发送人：<div id="userno">1234</div>
  接收人：<input type="text" id="usernoto"><br>
  <button onclick="closeWebSocket()">关闭WebSocket连接</button>
  <hr/>
  <div id="message"></div>
  <script type="text/javascript">
    var websocket = null;
    var userno = document.getElementById("userno").innerHTML;
    console.log(window)
    //判断当前浏览器是否支持WebSocket
    if('websocket' in window){
        websocket = new WebSocket("ws://localhost:8080/websocket/"+userno);
    }else{
        alert("当前浏览器 Not support websocket")
    }

    //连接发生错误的回调方法
    websocket.onerror = function () {
        setMessageInnerHTML("WebSocket连接发生错误");
    };
    //连接成功建立的回调方法
    websocket.onopen = function(){
        setMessageInnerHTML("WebSocket连接成功");
    };
    //接收到消息的回调方法
    websocket.onmessage = function(e){
        setMessageInnerHTML(e.data);
    }
    //连接关闭的回调方法
    websocket.onclose = function () {
        setMessageInnerHTML("WebSocket连接关闭");
    };
    //监听窗口关闭时间，当窗口关闭时，主动关闭websocket连接，防止连接还没断开就关闭窗口，server端会抛异常
    window.onbeforeunload = function () {
        closeWebsocket();
    }
    //将消息显示在网页上
    function setMessageInnerHTML(sendMessage){
        document.getElementById('message').innerHTML += sendMessage + '<br/>';
    }
    //关闭WebSocket连接
    function closeWebSocket(){
        websocket.close();
    }

    //发送消息
    function send() {
        var message = document.getElementById('text').value; //要发送的消息内容
        var now = getNowFormatDate(); //获取当前时间
        document.getElementById('message').innerHTML += (now+"发送人：" + userno + '<br/>'+"---"+message)+'<br/>';
        document.getElementById('message').style.color = "red";
        var ToSendUserno = document.getElementById('usernoto').value;
        message = message+"|"+ToSendUserno//将要发送的信息和内容拼起来，以便于服务端知道消息要发给谁
        websocket.send(message);
    }
    //获取当前时间
    function getNowFormatDate(){
        var date = new Date();
        var sep1 = "-";
        var sep2 = ":";
        var month = date.getMonth()+1;
        var strDate = date.getDate();
        if(month >= 1 &&month <=9){
            month = "0" + month;
        }
        if(strDate >= 0 && strDate <= 9){
            strDate = "0" + strDate;
        }
        var currentdate = date.getFullYear() + sep1 + month +sep1+strDate+" "+date.getHours()+sep2+date.getMinutes()+sep2+date.getSeconds();
        return currentdate;
    }
  </script>
  </body>
</html>
```
```jsp
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<html>
  <head>
    <title>Java后端WebSocket的Tomcat实现</title>
  </head>
  <body>
    Welcome<br/><input id="text" type="text"/>
    <button onclick="send()">发送消息</button>
    <hr/>
  <%--userno:发送消息人的编号--%>
  发送人：<div id="userno">456</div>
  接收人：<input type="text" id="usernoto"><br>
  <button onclick="closeWebSocket()">关闭WebSocket连接</button>
  <hr/>
  <div id="message"></div>
  <script type="text/javascript">
    var websocket = null;
    var userno = document.getElementById("userno").innerHTML;
    console.log(window)
    //判断当前浏览器是否支持WebSocket
    if('websocket' in window){
        websocket = new WebSocket("ws://localhost:8080/websocket/"+userno);
    }else{
        alert("当前浏览器 Not support websocket")
    }

    //连接发生错误的回调方法
    websocket.onerror = function () {
        setMessageInnerHTML("WebSocket连接发生错误");
    };
    //连接成功建立的回调方法
    websocket.onopen = function(){
        setMessageInnerHTML("WebSocket连接成功");
    };
    //接收到消息的回调方法
    websocket.onmessage = function(e){
        setMessageInnerHTML(e.data);
    }
    //连接关闭的回调方法
    websocket.onclose = function () {
        setMessageInnerHTML("WebSocket连接关闭");
    };
    //监听窗口关闭时间，当窗口关闭时，主动关闭websocket连接，防止连接还没断开就关闭窗口，server端会抛异常
    window.onbeforeunload = function () {
        closeWebsocket();
    }
    //将消息显示在网页上
    function setMessageInnerHTML(sendMessage){
        document.getElementById('message').innerHTML += sendMessage + '<br/>';
    }
    //关闭WebSocket连接
    function closeWebSocket(){
        websocket.close();
    }

    //发送消息
    function send() {
        var message = document.getElementById('text').value; //要发送的消息内容
        var now = getNowFormatDate(); //获取当前时间
        document.getElementById('message').innerHTML += (now+"发送人：" + userno + '<br/>'+"---"+message)+'<br/>';
        document.getElementById('message').style.color = "red";
        var ToSendUserno = document.getElementById('usernoto').value;
        message = message+"|"+ToSendUserno//将要发送的信息和内容拼起来，以便于服务端知道消息要发给谁
        console.log(message)
        websocket.send(message);
    }
    //获取当前时间
    function getNowFormatDate(){
        var date = new Date();
        var sep1 = "-";
        var sep2 = ":";
        var month = date.getMonth()+1;
        var strDate = date.getDate();
        if(month >= 1 &&month <=9){
            month = "0" + month;
        }
        if(strDate >= 0 && strDate <= 9){
            strDate = "0" + strDate;
        }
        var currentdate = date.getFullYear() + sep1 + month +sep1+strDate+" "+date.getHours()+sep2+date.getMinutes()+sep2+date.getSeconds();
        return currentdate;
    }
  </script>
  </body>
</html>
```