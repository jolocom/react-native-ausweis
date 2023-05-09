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
    
    @objc static override func requiresMainQueueSetup() -> Bool {
        return false
    }
}

struct OkResponse: Encodable {
    var message: String
}

struct ErrorResponse: Encodable {
    var error: String
}


func cb(msg: Optional<UnsafePointer<Int8>>) -> Void {
    if let unwrapped = msg {
        let response = OkResponse(message: String(cString: unwrapped))
        // TODO Better handling here
        let jsonString = try! JSONEncoder().encode(response)
        
        Emitter.shared?.sendEvent(withName: "onMessage", body: String(data: jsonString, encoding: .utf8))
    } else {
        Emitter.shared?.sendEvent(withName: "onSdkInit", body: nil)
    }
}



@objc(Aa2Sdk)
class Aa2Sdk: NSObject {
    func sendNotInitializedErrorEvent() {
        Emitter.shared?.sendEvent(
            withName: "onError",
            body: String(data: try! JSONEncoder().encode(ErrorResponse(error: "SdkNotInitializedException")), encoding: .utf8)
        )
    }

    @objc func sendCMD(_ command: String) {
        if(ausweisapp2_is_running()) {
            ausweisapp2_send(command)
            Emitter.shared?.sendEvent(withName: "onCommandSentSuccessfully", body: nil)
        } else {
            sendNotInitializedErrorEvent()
        }
      
    }
    
    
    @objc func initAASdk() {
        if (!ausweisapp2_init(cb, nil)) {
            Emitter.shared?.sendEvent(
                withName: "onError",
                body: String(data: try! JSONEncoder().encode(ErrorResponse(error: "SdkInitializationException")), encoding: .utf8)
            )
        }
    }
    
    @objc func disconnectSdk() {
        if (!ausweisapp2_is_running()) {
            sendNotInitializedErrorEvent()
        } else {
            ausweisapp2_shutdown()
            Emitter.shared?.sendEvent(withName: "onSdkDisconnect", body: nil)
        }
    }
}
