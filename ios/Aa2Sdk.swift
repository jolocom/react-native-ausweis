//
//  Aa2Sdk.swift
//  react-native-aa2-sdk
//
//  Created by Cristian Lungu on 30.07.21.
//

import Foundation
import AusweisApp2

extension Notification.Name {
    static let didInitialize = Notification.Name("didInitialize")
    static let didReceiveMessage = Notification.Name("didReceiveMessage")
}

func cb(msg: Optional<UnsafePointer<Int8>>) -> Void {
    if let response = msg {
        NotificationCenter.default.post(
            name: .didReceiveMessage,
            object: response,
            userInfo: ["response": String(cString: response)]
        )
    } else {
        NotificationCenter.default.post(
            name: .didInitialize,
            object: nil,
            userInfo: ["response": "{\"msg\": \"INIT\"}"]
        )
    }
}

@objc(Aa2Sdk)
class Aa2Sdk: NSObject {
    var messages: [String] = []
    private let notificationCenter = NotificationCenter.default
    
    @objc func sendCMD(_ command: String, resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        ausweisapp2_send(command)
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
        
        ausweisapp2_init(cb)

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
