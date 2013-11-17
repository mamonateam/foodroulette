//
//  UrlInterceptor.h
//  foodroulette
//
//  Created by Sergio Almecija Rodriguez on 11/17/13.
//
//

#import <Cordova/CDVPlugin.h>

@interface UrlInterceptor : CDVPlugin
- (void)pluginInitialize;
- (BOOL)webView:(UIWebView *)webView shouldStartLoadWithRequest:(NSURLRequest *)request navigationType:(UIWebViewNavigationType)navigationType;
@end
