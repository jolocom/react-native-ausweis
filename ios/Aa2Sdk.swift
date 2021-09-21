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

extension Notification.Name {
    static let didInitialize = Notification.Name("didInitialize")
    static let didReceiveMessage = Notification.Name("didReceiveMessage")
}

func cb(msg: Optional<UnsafePointer<Int8>>) -> Void {
    Emitter.shared?.sendEvent(withName: "onMessage", body: 5
    )
    if let response = msg {
        Emitter.shared?.sendEvent(withName: "onMessage", body: String(cString: response))
    } else {
        Emitter.shared?.sendEvent(withName: "onSdkInit", body: nil)
    }
}



@objc(Aa2Sdk)
class Aa2Sdk: NSObject {
    var messages: [String] = []
    private let notificationCenter = NotificationCenter.default
    private let emitter = Emitter()
    
    @objc func sendCMD(_ command: String, resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        ausweisapp2_send(command)
        
        self.emitter.sendEvent(withName: "onCommandSentSuccesfully", body: nil)
        resolve(true)
    }
    
    
    @objc func initAASdk(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        // TODO Move to constructor
        notificationCenter.addObserver(
            self,
            selector: #selector(self.handleNotification(notification:)),
            name: .didInitialize,
            object: nil
        )
        // TODO Move to constructor

        notificationCenter.addObserver(
            self,
            selector: #selector(self.handleNotification(notification:)),
            name: .didReceiveMessage,
            object: nil)
        
        if (ausweisapp2_init(cb)) {
            self.emitter.sendEvent(withName: "onSdkInit", body: nil)
        } else {
            // TODO Throw an error / emit an error here.
        }

        resolve(nil)
    }
    
    @objc func handleNotification(notification: Notification) {
        if let userInfo = notification.userInfo as? Dictionary<String, String>{
            if let response = userInfo["response"] {
                self.messages.append(response)
            }
        }
    }
    
    @objc func getNewEvents(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        resolve(self.messages)
        self.messages.removeAll()
    }
    
    @objc func disconnectSdk() {
        print("TODO IMPLEMENT")
    }
}
