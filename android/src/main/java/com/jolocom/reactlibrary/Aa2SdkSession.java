package com.jolocom.reactlibrary;

import com.facebook.react.bridge.Promise;
import com.governikus.ausweisapp2.IAusweisApp2SdkCallback;

public class Aa2SdkSession extends IAusweisApp2SdkCallback.Stub {
    private final Promise promise;
    private final SessionMessagesBuffer sessionMessagesBuffer;

    public Aa2SdkSession(Promise promise) {
        this.promise = promise;
        this.sessionMessagesBuffer = new SessionMessagesBuffer();
    }

    @Override
    public void sessionIdGenerated(String sessionId, boolean isSecureSessionId) {
        this.sessionMessagesBuffer.setSessionId(sessionId);

        System.out.println("RESOLVING");
        this.promise.resolve("Ok");
    }

    @Override
    public void receive(String json) {
        this.sessionMessagesBuffer.pushMessage(json);
    }

    // TODO Add
    @Override
    public void sdkDisconnected() {
    }

    public SessionMessagesBuffer getSessionMessagesBuffer() {
        return this.sessionMessagesBuffer;
    }
}
