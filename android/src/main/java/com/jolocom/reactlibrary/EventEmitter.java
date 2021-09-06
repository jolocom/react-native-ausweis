package com.jolocom.reactlibrary;

import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter;

public class EventEmitter {
    private final RCTDeviceEventEmitter eventEmitterModule;
    private final EventMessageFactory eventMessageFactory;

    public EventEmitter(RCTDeviceEventEmitter eventEmitterModule) {
        this.eventEmitterModule = eventEmitterModule;
        this.eventMessageFactory = new EventMessageFactory();
    }

    public void emit(EventName eventName) {
        this.emit(eventName, "");
    }

    public void emit(EventName eventName, String message) {
        EventMessage eventMessage = this.eventMessageFactory.create(eventName, message);

        this.eventEmitterModule.emit(eventMessage.getEventName(), eventMessage.getMessage());
    }
}
