package com.jolocom.reactlibrary;

import com.governikus.ausweisapp2.IAusweisApp2SdkCallback;

public class Aa2SdkSession extends IAusweisApp2SdkCallback.Stub {
    private final SessionMessagesBuffer sessionMessagesBuffer = new SessionMessagesBuffer();

    @Override
    public void sessionIdGenerated(String sessionId, boolean isSecureSessionId) {
        this.sessionMessagesBuffer.setSessionId(sessionId);
        this.receive("{\"msg\": \"INIT\"}");
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
