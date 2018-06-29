---
title: springmvc中在拦截器中修改响应头
date: 2018-05-07 16:35:45
tags: [Spring,Java]
category: article
---
&emsp;今天在工作时需要在每次响应时去更新响应头信息，却遇到了无比大坑（自己太菜，以前并没有学习到，哈哈），在Springmvc拦截器中的postHandle方法和afterHandle方法中去添加响应头信息，并不能成功，但是在preHandle中添加却能成功。然后百度了一下才发现，这种情况只有在被@ResponseBody注释的方法才会发生。
走一下spring的流程查一遍，直接从ServletInvocableHandlerMethod的invokeAndHandle找起：
```java
 1      public void invokeAndHandle(ServletWebRequest webRequest, ModelAndViewContainer mavContainer,
 2             Object... providedArgs) throws Exception {
 3 
 4         Object returnValue = invokeForRequest(webRequest, mavContainer, providedArgs);
 5         setResponseStatus(webRequest);
 6 
 7         if (returnValue == null) {
 8             if (isRequestNotModified(webRequest) || hasResponseStatus() || mavContainer.isRequestHandled()) {
 9                 mavContainer.setRequestHandled(true);
10                 return;
11             }
12         }
13         else if (StringUtils.hasText(this.responseReason)) {
14             mavContainer.setRequestHandled(true);
15             return;
16         }
17 
18         mavContainer.setRequestHandled(false);
19         try {
20             this.returnValueHandlers.handleReturnValue(
21                     returnValue, getReturnValueType(returnValue), mavContainer, webRequest);
22         }
23         catch (Exception ex) {
24             if (logger.isTraceEnabled()) {
25                 logger.trace(getReturnValueHandlingErrorMessage("Error handling return value", returnValue), ex);
26             }
27             throw ex;
28         }
29     }
```
进到handleReturnValue这个方法里：
```java
1     public void handleReturnValue(Object returnValue, MethodParameter returnType,
2             ModelAndViewContainer mavContainer, NativeWebRequest webRequest) throws Exception {
3 
4         HandlerMethodReturnValueHandler handler = selectHandler(returnValue, returnType);
5         if (handler == null) {
6             throw new IllegalArgumentException("Unknown return value type: " + returnType.getParameterType().getName());
7         }
8         handler.handleReturnValue(returnValue, returnType, mavContainer, webRequest);
9     }
```
这是选择对应的处理器处理返回值，继续往下：
因为是被@ResponseBody注释的方法，所以我们进到了RequestResponseBodyMethodProcessor的实现里：
```java
 1     @Override
 2     public void handleReturnValue(Object returnValue, MethodParameter returnType,
 3             ModelAndViewContainer mavContainer, NativeWebRequest webRequest)
 4             throws IOException, HttpMediaTypeNotAcceptableException, HttpMessageNotWritableException {
 5 
 6         mavContainer.setRequestHandled(true);
 7         ServletServerHttpRequest inputMessage = createInputMessage(webRequest);
 8         ServletServerHttpResponse outputMessage = createOutputMessage(webRequest);
 9 
10         // Try even with null return value. ResponseBodyAdvice could get involved.
11         writeWithMessageConverters(returnValue, returnType, inputMessage, outputMessage);
12     }
```
前两步是设置了状态，并将原生的request和response封装一下再返回，我们看writeWithMessageConverters里做了什么：
```java
 1   protected <T> void writeWithMessageConverters(T value, MethodParameter returnType,
 2             ServletServerHttpRequest inputMessage, ServletServerHttpResponse outputMessage)
 3             throws IOException, HttpMediaTypeNotAcceptableException, HttpMessageNotWritableException {
 4 
 5         Object outputValue;
 6         Class<?> valueType;
 7         Type declaredType;
 8 
 9         if (value instanceof CharSequence) {
10             outputValue = value.toString();
11             valueType = String.class;
12             declaredType = String.class;
13         }
14         else {
15             outputValue = value;
16             valueType = getReturnValueType(outputValue, returnType);
17             declaredType = getGenericType(returnType);
18         }
19 
20         HttpServletRequest request = inputMessage.getServletRequest();
21         List<MediaType> requestedMediaTypes = getAcceptableMediaTypes(request);
22         List<MediaType> producibleMediaTypes = getProducibleMediaTypes(request, valueType, declaredType);
23 
24         if (outputValue != null && producibleMediaTypes.isEmpty()) {
25             throw new IllegalArgumentException("No converter found for return value of type: " + valueType);
26         }
27 
28         Set<MediaType> compatibleMediaTypes = new LinkedHashSet<MediaType>();
29         for (MediaType requestedType : requestedMediaTypes) {
30             for (MediaType producibleType : producibleMediaTypes) {
31                 if (requestedType.isCompatibleWith(producibleType)) {
32                     compatibleMediaTypes.add(getMostSpecificMediaType(requestedType, producibleType));
33                 }
34             }
35         }
36         if (compatibleMediaTypes.isEmpty()) {
37             if (outputValue != null) {
38                 throw new HttpMediaTypeNotAcceptableException(producibleMediaTypes);
39             }
40             return;
41         }
42 
43         List<MediaType> mediaTypes = new ArrayList<MediaType>(compatibleMediaTypes);
44         MediaType.sortBySpecificityAndQuality(mediaTypes);
45 
46         MediaType selectedMediaType = null;
47         for (MediaType mediaType : mediaTypes) {
48             if (mediaType.isConcrete()) {
49                 selectedMediaType = mediaType;
50                 break;
51             }
52             else if (mediaType.equals(MediaType.ALL) || mediaType.equals(MEDIA_TYPE_APPLICATION)) {
53                 selectedMediaType = MediaType.APPLICATION_OCTET_STREAM;
54                 break;
55             }
56         }
57 
58         if (selectedMediaType != null) {
59             selectedMediaType = selectedMediaType.removeQualityValue();
60             for (HttpMessageConverter<?> messageConverter : this.messageConverters) {
61                 if (messageConverter instanceof GenericHttpMessageConverter) {
62                     if (((GenericHttpMessageConverter) messageConverter).canWrite(
63                             declaredType, valueType, selectedMediaType)) {
64                         outputValue = (T) getAdvice().beforeBodyWrite(outputValue, returnType, selectedMediaType,
65                                 (Class<? extends HttpMessageConverter<?>>) messageConverter.getClass(),
66                                 inputMessage, outputMessage);
67                         if (outputValue != null) {
68                             addContentDispositionHeader(inputMessage, outputMessage);
69                             ((GenericHttpMessageConverter) messageConverter).write(
70                                     outputValue, declaredType, selectedMediaType, outputMessage);
71                             if (logger.isDebugEnabled()) {
72                                 logger.debug("Written [" + outputValue + "] as \"" + selectedMediaType +
73                                         "\" using [" + messageConverter + "]");
74                             }
75                         }
76                         return;
77                     }
78                 }
79                 else if (messageConverter.canWrite(valueType, selectedMediaType)) {
80                     outputValue = (T) getAdvice().beforeBodyWrite(outputValue, returnType, selectedMediaType,
81                             (Class<? extends HttpMessageConverter<?>>) messageConverter.getClass(),
82                             inputMessage, outputMessage);
83                     if (outputValue != null) {
84                         addContentDispositionHeader(inputMessage, outputMessage);
85                         ((HttpMessageConverter) messageConverter).write(outputValue, selectedMediaType, outputMessage);
86                         if (logger.isDebugEnabled()) {
87                             logger.debug("Written [" + outputValue + "] as \"" + selectedMediaType +
88                                     "\" using [" + messageConverter + "]");
89                         }
90                     }
91                     return;
92                 }
93             }
94         }
95 
96         if (outputValue != null) {
97             throw new HttpMediaTypeNotAcceptableException(this.allSupportedMediaTypes);
98         }
99     }
```
虽然写了一大段，但是我们看到对outputMessage进行操作的只有在下面这个for循环里，我们就重点关注下这里操作了什么：
```java
 1              for (HttpMessageConverter<?> messageConverter : this.messageConverters) {
 2                 if (messageConverter instanceof GenericHttpMessageConverter) {
 3                     if (((GenericHttpMessageConverter) messageConverter).canWrite(
 4                             declaredType, valueType, selectedMediaType)) {
 5                         outputValue = (T) getAdvice().beforeBodyWrite(outputValue, returnType, selectedMediaType,
 6                                 (Class<? extends HttpMessageConverter<?>>) messageConverter.getClass(),
 7                                 inputMessage, outputMessage);
 8                         if (outputValue != null) {
 9                             addContentDispositionHeader(inputMessage, outputMessage);
10                             ((GenericHttpMessageConverter) messageConverter).write(
11                                     outputValue, declaredType, selectedMediaType, outputMessage);
12                             if (logger.isDebugEnabled()) {
13                                 logger.debug("Written [" + outputValue + "] as \"" + selectedMediaType +
14                                         "\" using [" + messageConverter + "]");
15                             }
16                         }
17                         return;
18                     }
19                 }
```
重点应该是在write这个方法里，这里是Converter对内容进行转化。
由于我们用的converter是FastJsonHttpMessageConverter，具体实现如下：
```java
 1     public void write(Object t, //
 2                       Type type, //
 3                       MediaType contentType, //
 4                       HttpOutputMessage outputMessage //
 5     ) throws IOException, HttpMessageNotWritableException {
 6 
 7         HttpHeaders headers = outputMessage.getHeaders();
 8         if (headers.getContentType() == null) {
 9             if (contentType == null || contentType.isWildcardType() || contentType.isWildcardSubtype()) {
10                 contentType = getDefaultContentType(t);
11             }
12             if (contentType != null) {
13                 headers.setContentType(contentType);
14             }
15         }
16         if (headers.getContentLength() == -1) {
17             Long contentLength = getContentLength(t, headers.getContentType());
18             if (contentLength != null) {
19                 headers.setContentLength(contentLength);
20             }
21         }
22         writeInternal(t, outputMessage);
23         outputMessage.getBody().flush();
24     }
```
看看是不是flush动作导致了response状态改为已经被提交，所以导致设置header失效，试一试：
```java
 1      @RequestMapping("queryAuditList")
 2      @ResponseBody
 3      @SaveParam
 4      public JSONObject queryAuditList( HttpServletResponse res) {
 5          res.addCookie(new Cookie("befroe", "1"));
 6          try {
 7             res.getOutputStream().flush();
 8         } catch (IOException e) {
 9             // TODO Auto-generated catch block
10             e.printStackTrace();
11         }
12          res.addCookie(new Cookie("after", "1"));
13          return new JSONObject();
14      }
```
果然是这样！

再看下servlet文档里的说法：

isCommitted

public boolean isCommitted()
Returns a boolean indicating if the response has been committed. A committed response has already had its status code and headers written.
 

 划重点：A committed response has already had its status and headers written.

所以flush操作是会导致response的commited状态被修改的，也就是说这时response的头信息已经被确定了！

解决方案：由于Controller方法中已经使用了@ResponseBody注解返回json数据，故不能通过Spring拦截器响应消息头，但是Spring同时还提供了一个ResponseBodyAdvice接口，允许在这种情境下实现对响应消息头的控制。
```java
@ControllerAdvice
public class HeaderModifierAdvice implements ResponseBodyAdvice<Object> {
    @Override
    public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {
        return true;
    }

    @Override
    public Object beforeBodyWrite(Object body, MethodParameter returnType, MediaType selectedContentType,
            Class<? extends HttpMessageConverter<?>> selectedConverterType, ServerHttpRequest request,
            ServerHttpResponse response) {
        ServletServerHttpRequest ssReq = (ServletServerHttpRequest)request;
        ServletServerHttpResponse ssResp = (ServletServerHttpResponse)response;
        if(ssReq == null || ssResp == null
                || ssReq.getServletRequest() == null
                || ssResp.getServletResponse() == null) {
            return body;
        }
        
        // 对于未添加跨域消息头的响应进行处理
        HttpServletRequest req = ssReq.getServletRequest();
        HttpServletResponse resp = ssResp.getServletResponse();
        String originHeader = "Access-Control-Allow-Origin";
        if(!resp.containsHeader(originHeader)) {
            String origin = req.getHeader("Origin");
            if(origin == null) {
                String referer = req.getHeader("Referer");
                if(referer != null) {
                    origin = referer.substring(0, referer.indexOf("/", 7));
                }
            }
            resp.setHeader("Access-Control-Allow-Origin", origin);
        }
        
        String credentialHeader = "Access-Control-Allow-Credentials";
        if(!resp.containsHeader(credentialHeader)) {
            resp.setHeader(credentialHeader, "true");
        }
        return body;
    }
}
```
总结：对于使用了@ResponseBody注解的场景，如果需要统一调整响应消息头，只能通过自定义ResponseBodyAdvice实现来完成。