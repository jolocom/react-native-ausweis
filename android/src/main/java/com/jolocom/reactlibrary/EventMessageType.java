package com.jolocom.reactlibrary;

public enum EventMessageType {
    MESSAGE("message"),
    ERROR("error");

    public final String value;

    EventMessageType(String value) {
        this.value = value;
    }
}
