#import "AppDelegate.h"
#import <Firebase.h>
#import <GoogleMaps/GoogleMaps.h>
#import <React/RCTBundleURLProvider.h>
//#import "RNSplashScreen.h"  // here

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [GMSServices provideAPIKey:@"AIzaSyD9kqmFzEM2-3enbgvOzZzBjHRtoP_kcns"];
  [FIRApp configure];
//  [RNSplashScreen show];
  self.moduleName = @"RYD_Passenger";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};
  [self showSplashScreen];
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (void)showSplashScreen {
    dispatch_async(dispatch_get_main_queue(), ^{
        Class splashClass = NSClassFromString(@"SplashView");
        if (splashClass) {
            id splashInstance = [splashClass performSelector:NSSelectorFromString(@"sharedInstance")];
            if (splashInstance && [splashInstance respondsToSelector:NSSelectorFromString(@"showSplash")]) {
                [splashInstance performSelector:NSSelectorFromString(@"showSplash")];
            }
        }
    });
}

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
  return YES;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

- (void)customizeRootView:(RCTRootView *)rootView {
  [super customizeRootView:rootView]; // ⬅️ initialize the splash screen
}

@end
