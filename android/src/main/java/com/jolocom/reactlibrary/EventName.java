package com.jolocom.reactlibrary;

public enum EventName {
    ON_ERROR("onError"),
    ON_MESSAGE("onMessage"),
    ON_SDK_INIT("onSdkInit"),
    ON_SDK_DISCONNECT("onSdkDisconnect"),
    ON_SESSION_ID_RECEIVE("onSessionIdReceive"),
    ON_COMMAND_SENT_SUCCESSFULLY("onCommandSentSuccessfully"),
    ON_NEW_INTENT_SUCCESS("onNewIntentSuccess");

    public final String value;

    EventName(String value) {
        this.value = value;
    }
}
