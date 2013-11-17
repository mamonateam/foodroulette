//
//  UrlInterceptor.m
//  foodroulette
//
//  Created by Sergio Almecija Rodriguez on 11/17/13.
//
//

#import "UrlInterceptor.h"

@implementation UrlInterceptor
- (void)pluginInitialize
{
    NSLog(@"Plugin up!!");
}

- (BOOL)webView:(UIWebView *)webView shouldStartLoadWithRequest:(NSURLRequest *)request navigationType:(UIWebViewNavigationType)navigationType
{
    NSString *requestUrl = [[request URL] absoluteString];
    NSLog(@"Url: %@", requestUrl);
    if ([requestUrl hasPrefix: @"http://localhost:9000/#/login"]) {
        // rewrite the url to internal one
        NSString *path = [[NSBundle  mainBundle] resourcePath];
        NSLog(@"resourcePath %@", path);
        [webView loadRequest: [[NSURLRequest alloc] initWithURL: [[NSURL alloc] initWithString:path]]];
        return NO;
    }
    return YES;
}

@end
