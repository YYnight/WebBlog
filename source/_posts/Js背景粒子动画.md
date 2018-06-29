---
title: Js背景粒子动画
date: 2018-05-04 15:47:42
category: code
tags: [Js]
---

&emsp;看到许多大神写的各种js动画插件，觉得特别nice，刚好身边有一份粒子动画的源码，不过存在部分bug，本着边用边学的精神，深入学习了这段代码，并修复了其中存在的问题，有可能以后还能用到，在这记录一下。
```js
const conf = {
    count: 150,
    r1: 85,
    r2: 100,
    opacity: .7,
    color: '#000'
}
let canvas,ctx;
const ww = window.innerWidth;
const wh = window.innerHeight;

let nodes = [];
let cnode = {
    x:0,
    y:0,
    dx:0,
    dy:0,
    r:0
};

window.onload = function() {
    canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d');
    canvas.style.zIndex = '-1';
    canvas.style.position = 'fixed';
    canvas.style.left = 0;
    canvas.style.top = 0;
    canvas.style.opacity = conf.opacity;
    canvas.width = ww;
    canvas.height = wh;
    document.body.appendChild(canvas);

    for(let i = 0; i < conf.count; i++){
        nodes.push({
            x: Math.random() * ww,
            y: Math.random() * wh,
            dx: Math.random() * 2 - 1,
            dy: Math.random() * 2 - 1,
            r : conf.r1
        })
    }
    nodes.push(cnode);
    render();

    document.body.onmousemove = function(event){
        const e = event || window.event;
        cnode.x = e.clientX;
        cnode.y = e.clientY;
        cnode.r = conf.r2;
    }

    document.body.onmouseleave = function(event){
        cnode.x = 0;
        cnode.y = 0;
        cnode.r = 0;
    }
}

function parseColor(c,a) {
    let rgba = [0, 0, 0];
    if(c.length === 4) {
        rgba = Array.prototype.slice.call(c,1).map((i) => parseInt(i,16))
    } else {
        rgba[0] = parseInt(c.substr(1,2), 16) || 0;
        rgba[1] = parseInt(c.substr(3,2), 16) || 0;
        rgba[2] = parseInt(c.substr(5,2), 16) || 0;
    }
    rgba.push(a);
    return 'rgba(' + rgba.join(',') + ')';
}

function render() {
    ctx.clearRect(0, 0, ww, wh);
    nodes.forEach(function(node, index){
        ctx.fillRect(node.x - .5, node.y - .5, 1, 1);
        for(let i = index + 1; i < nodes.length; i++){
            let n = nodes[i];
            let dx = n.x - node.x;
            let dy = n.y - node.y;
            let r2 = n.r * n.r;
            let d2 = dx * dx + dy * dy;
            let rt = 1 - d2 /r2;
            if(d2 < r2){
                ctx.beginPath();
                ctx.lineWidth = rt/2;
                ctx.strokeStyle = parseColor(conf.color,rt);
                ctx.moveTo(n.x,n.y);
                ctx.lineTo(node.x, node.y);
                ctx.stroke();
                if(n === cnode && d2 > r2 / 2){
                    node.x += dx * 0.03;
                    node.y += dy * 0.03;
                }
            }
        }
        node.x += node.dx;
        node.y += node.dy;
        node.dx *= node.x > ww || node.x < 0 ? -1 : 1;
        node.dy *= node.y > wh || node.y < 0 ? -1 : 1;
    })
    requestAnimationFrame(render);
}
```