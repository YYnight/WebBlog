---
title: String并没有那么简单
date: 2018-11-09 13:45:38
tags: [Java]
category: article
---

​	对于String，可能大家非常熟悉，可是它并非看起来那么简单。一般创建String有两种不同的创建方法。第一种是通过双引号创建，第二种是通过new创建。

### 直接使用双引号创建字符串

```java
String a1 = "A";
String a2 = "A";
System.out.pringln(a1 == a2); // true
```

​	这个很容易理解吧，创建a1时，因为A并不存在于常量池，所以先在常量池中创建A，然后返回给a1,在创建a2的时候，因为常量池中已经存在A，所以直接返回给a2。

###使用new创建字符串

```java
String b1 = new String("B");
System.out.println(b1 == b1.intern()); //false
```

​	因为在创建b1对象时，因为他的参数“B”，所以现在常量池中创建了该常量，b1.intern()方法返回的是在常量池中的常量“B”，而b1是指向堆中的地址空间

```java
public static void main(String[] args) {
    
    String aa = "aa";
    String bb = "bb";
    String ccdd = "cc" + "dd";	//在编译期直接编译为“ccdd”，故常量池中只有ccdd，没有cc和dd
    String eeff = new String("ee") + String("ff");	//添加ee和ff到常量池，并添加ee，ff，eeff到堆
    String aabb = aa + bb;	//添加aabb到堆，这块相当于使用了StringBuilder拼接
    String gghh = "gg" + new String("hh");	//添加gg和hh到常量池，添加hh和gghh到堆
    
    aa.intern();	//因为aa已经存在于常量池，故返回常量aa
    ccdd.intern();	//返回常量ccdd
    eeff.intern();	//添加eeff对象的引用地址到常量池，并返回eeff的引用
    aabb.intern();	//添加eeff对象的引用地址到常量池，并返回eeff的引用
    gghh.intern();	//添加eeff对象的引用地址到常量池，并返回eeff的引用
    
    System.out.println(aa.intern() == aa);	//true
    System.out.println(eeff.intern() == "eeff");	//true
    System.out.println("eeff" == eeff);	//true
    String nccdd = new String("nccdd");	
    System.out.println(ccdd == nccdd);	//false
    System.out.println(ccdd == nccdd.intern());	//true
    System.out.println(aabb.intern() == aabb); //true
    System.out.println(gghh == gghh.intern()); //true
}
```

**小结**

​	*1.使用双引号创建字符串：*

​		*如果常量已经存在或者已存在这个常量在堆上的引用地址*

​			*若是常量，返回常量池中的常量，若是引用，返回这个引用地址指向的堆空间对象*

​		*如果常量不存在*

​			*在常量池中创建常量，并返回该常量*

​	*2.使用new创建字符串*

​		*如果这个new操作的参数是双引号字符串，先判断这个常量在常量池中是否存在，若不存在则在常量池											中创建，若存在，什么都不做，然后在堆空间上创建字符串对象*

|                | 常量池上的常量 | 常量池中的引用 | 堆上对象 |
| -------------- | -------------- | -------------- | -------- |
| 常量池上的对象 | ❌              | 不共存         | 共存     |
| 常量池上的引用 | 不共存         | ❌              | 共存     |
| 堆上对象       | 共存           | 共存           | ❌        |



###下面有一道比较有趣的题

```java
public class RuntimeConstantPoolOOM {
    public static void main(String[] args) {
        String str1 = new StringBuilder("计算机").append("软件").toString();
       	System.out.println(str1.intern() == str1);
        
        String str2 = new StringBuilder("ja").append("va").toString();
        System.out.println(str2.intern() == str2);
    }
}
```

​	这段代码在JDK1.6中运行，会得到两个false，而在JDK1.7中运行，会得到一个true和一个false。产生差异的原因是：在JDK1.6中，intern()方法会把首次遇到的字符串实力复制到永久代中，返回的也是永久代中这个字符串实例的引用，而由StringBuilder创建的字符串实例在Java堆上，所以必然不是同一个引用，将返回false。而JDK1.7（以及部分其他虚拟机，例如JRockit）的intern()实现不会再复制实例，只是在常量池中记录首次出现的实例引用，因此intern()返回的引用和由StringBuilder创建的那个字符串实例是同一个。对str2比较返回false是因为“Java”这个字符串在执行StringBuilder.toString()之前已经出现过，字符串常量池中已经有它的引用了，不符合“首次出现”的原则，而“计算机软件”这个字符串则是首次出现的，因此返回true。