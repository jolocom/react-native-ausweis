package com.jolocom.reactlibrary;

import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter;
import com.governikus.ausweisapp2.IAusweisApp2SdkCallback;

public class Aa2SdkSession extends IAusweisApp2SdkCallback.Stub {
    private final SessionMessagesBuffer sessionMessagesBuffer = new SessionMessagesBuffer();
    private final RCTDeviceEventEmitter eventEmitterModule;

    public Aa2SdkSession(RCTDeviceEventEmitter eventEmitterModule) {
        this.eventEmitterModule = eventEmitterModule;
    }

    @Override
    public void sessionIdGenerated(String sessionId, boolean isSecureSessionId) {
        this.sessionMessagesBuffer.setSessionId(sessionId);
        this.receive("{\"msg\": \"INIT\"}");
    }

    @Override
    public void receive(String json) {
        WritableNativeArray payload = new WritableNativeArray();
        payload.pushString(json);

        // TODO: Define the events name since it will be the same on the listening js side
        this.eventEmitterModule.emit("sdkMessage", payload);
    }

    // TODO Add
    @Override
    public void sdkDisconnected() {
    }

    public SessionMessagesBuffer getSessionMessagesBuffer() {
        return this.sessionMessagesBuffer;
    }
}
