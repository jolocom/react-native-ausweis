package com.jolocom.reactlibrary;

import com.governikus.ausweisapp2.IAusweisApp2SdkCallback;

public class Aa2SdkSession extends IAusweisApp2SdkCallback.Stub {
    private final EventEmitter eventEmitter;
    private String sessionId;

    public Aa2SdkSession(EventEmitter eventEmitter) {
        this.eventEmitter = eventEmitter;
    }

    @Override
    public void sessionIdGenerated(String sessionId, boolean isSecureSessionId) {
        this.sessionId = sessionId;

        this.eventEmitter.emit(EventName.ON_SESSION_ID_RECEIVE, sessionId);
    }

    @Override
    public void receive(String json) {
        this.eventEmitter.emit(EventName.ON_MESSAGE, json);
    }

    // TODO Add
    @Override
    public void sdkDisconnected() {
    }

    public String getSessionId() {
        return sessionId;
    }
}
