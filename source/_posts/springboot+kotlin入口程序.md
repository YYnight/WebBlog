---
title: springboot+kotlin入口程序
date: 2018-05-02 16:21:37
tags: [springboot,kotlin]
category: code
---
&emsp;&emsp;随着动态语言的流行（Ruby、Groovy、Scala、Node.js），java的开发显得格外的笨重：繁多的配置、低下的开发效率、复杂的部署流程以及第三方集成难度大。在这种环境下，Spring Boot应运而生。它使用“习惯优于配置”（项目中存在大量的配置，此外还内置一个习惯性的配置，让你无需手动配置）的理念让你的项目快速运行起来。使用Spring Boot很容易创建一个独立运行（运行jar，内嵌Servlet容器）、准生产级别的基于Spring框架的项目，使用Spring Boot你可以不用或者只需要很少的Spring配置。下面是使用kotlin编写的Spring boot的一个入口程序：

```kotlin
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.builder.SpringApplicationBuilder


/**
 * Application类，作为项目主类存在
 *
 * @author dyoon
 * @date 2017-02-20 16:43
 */
@SpringBootApplication
class Application {

    /**
    * 程序唯一入口
    */
    fun main(args: Array<String>) {
        SpringApplicationBuilder().sources(Application::class.java).run(*args)
    }
}

```