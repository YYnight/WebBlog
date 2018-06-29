---
title: nginx的简单命令以及一些配置
date: 2018-05-07 16:04:24
tags: nginx
category: article
---
&emsp;最近公司在做的项目是前后端分离的，前台代码需要挂在nginx上。也可以用nginx搭建静态资源服务器，传统的web项目，静态资源一般存放在webroot目录下，这样虽然很方便获取，但是web项目很大，会对服务器的性能造成很大干扰，这时就需要一个静态资源的服务器了。
&emsp;
下面是对nginx.conf的简单配置：
```conf
    server{
        listen 80;
        server_name localhost;
        location / {
            proxy_set_header X-real-ip $remote_addr; //这句是添加浏览器端的ip地址到请求头中
            root html;
            index index.html index.htm;
        }
        location /image/{
            root /usr/local/myImage/;
            autoindex on;
        }
    }
```