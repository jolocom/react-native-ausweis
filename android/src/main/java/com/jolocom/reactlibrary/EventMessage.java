package com.jolocom.reactlibrary;

public class EventMessage {
    private final EventName eventNameEnum;
    private final EventMessageType typeEnum;
    private final String message;

    public EventMessage(EventName eventNameEnum, EventMessageType typeEnum, String message) {
        this.eventNameEnum = eventNameEnum;
        this.typeEnum = typeEnum;
        this.message = message;
    }

    public EventName getEventNameEnum() {
        return this.eventNameEnum;
    }

    public String getEventName() {
        return this.eventNameEnum.value;
    }

    public EventMessageType getTypeEnum() {
        return this.typeEnum;
    }

    public String getMessage() {
        return this.message;
    }
}
