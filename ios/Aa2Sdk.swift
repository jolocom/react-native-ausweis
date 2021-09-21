//
//  Aa2Sdk.swift
//  react-native-aa2-sdk
//
//  Created by Cristian Lungu on 30.07.21.
//

import Foundation
import AusweisApp2

@objc(Emitter)
class Emitter: RCTEventEmitter {
    public static var shared:Emitter?
    
    override init() {
        super.init()
        Emitter.shared = self
    }
    override func supportedEvents() -> [String]! {
        return ["onMessage", "onError", "onSdkInit", "onSdkDisconnect", "onSessionIdReceive", "onCommandSentSuccessfully", "onNewIntentSuccess"]
    }
    
}
struct MSGResponse: Encodable {
    var message: String
}

struct ERRORResponse: Encodable {
    var error: String
}

func cb(msg: Optional<UnsafePointer<Int8>>) -> Void {
    if let response = msg {
        let message = MSGResponse(message: String(cString: response))
        // TODO Switch from error propagation to throwing an error.
        let encodedMessage = try! JSONEncoder().encode(message)
        Emitter.shared?.sendEvent(withName: "onMessage", body: String(data: encodedMessage, encoding: .utf8))
    } else {
        Emitter.shared?.sendEvent(withName: "onSdkInit", body: nil)
    }
}



@objc(Aa2Sdk)
class Aa2Sdk: NSObject {
    // private let emitter = Emitter()
    
    @objc func sendCMD(_ command: String, resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        ausweisapp2_send(command)
        
        Emitter.shared?.sendEvent(withName: "onCommandSentSuccessfully", body: nil)
        resolve(true)
    }
    
    
    @objc func initAASdk(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        if (ausweisapp2_init(cb)) {
            Emitter.shared?.sendEvent(withName: "onSdkInit", body: nil)
        } else {
            Emitter.shared?.sendEvent(
                withName: "onError",
                body: String(data: try! JSONEncoder().encode(ERRORResponse(error: "SDK already initialized")), encoding: .utf8)
            )
        }

        resolve(nil)
    }
    
    @objc func disconnectSdk() {
        ausweisapp2_shutdown()
        Emitter.shared?.sendEvent(withName: "onSdkDisconnect", body: nil)

    }
}
