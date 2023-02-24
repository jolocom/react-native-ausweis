// Aa2Sdk.m

// import RCTBridgeModule
#if __has_include(<React/RCTBridgeModule.h>)
#import <React/RCTBridgeModule.h>
#elif __has_include(“RCTBridgeModule.h”)
#import “RCTBridgeModule.h”
#else
#import “React/RCTBridgeModule.h” // Required when used as a Pod in a Swift project
#endif

// import RCTEventEmitter
#if __has_include(<React/RCTEventEmitter.h>)
#import <React/RCTEventEmitter.h>
#elif __has_include(“RCTEventEmitter.h”)
#import “RCTEventEmitter.h”
#else
#import “React/RCTEventEmitter.h” // Required when used as a Pod in a Swift project
#endif

@interface RCT_EXTERN_MODULE(Aa2Sdk, NSObject)
RCT_EXTERN_METHOD(sendCMD: (NSString *) cmd)

RCT_EXTERN_METHOD(initAASdk)

RCT_EXTERN_METHOD(disconnectSdk)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}
@end


@interface RCT_EXTERN_MODULE(Emitter, RCTEventEmitter)

RCT_EXTERN_METHOD(supportedEvents)

@end
