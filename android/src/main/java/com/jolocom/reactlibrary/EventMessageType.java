package com.jolocom.reactlibrary;

public enum EventMessageType {
    MESSAGE("message"),
    ERROR("error");

    public final String type;

    EventMessageType(String type) {
        this.type = type;
    }
}
