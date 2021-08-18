package com.jolocom.reactlibrary;

import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableNativeArray;

public class SessionMessagesBuffer {
    private String sessionId;
    private WritableArray buffer;

    public SessionMessagesBuffer() {
        this.buffer = new WritableNativeArray();
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getSessionId() {
        return sessionId;
    }

    public WritableArray getBuffer() {
        return buffer;
    }

    public void pushMessage(String message) {
        this.buffer.pushString(message);
    }

    public void resetBuffer() {
        this.buffer = new WritableNativeArray();
    }
}
