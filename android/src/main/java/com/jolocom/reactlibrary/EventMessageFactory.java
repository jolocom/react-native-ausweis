package com.jolocom.reactlibrary;

import android.util.Log;

import com.jolocom.reactlibrary.exception.EventMessageEmittingException;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Objects;

public class EventMessageFactory {
    private final HashMap<EventName, EventMessageType> nameToMessageTypeMap;

    public EventMessageFactory() {
        this.nameToMessageTypeMap = new HashMap<>();
        this.nameToMessageTypeMap.put(EventName.ON_ERROR, EventMessageType.ERROR);
        this.nameToMessageTypeMap.put(EventName.ON_MESSAGE, EventMessageType.MESSAGE);
        this.nameToMessageTypeMap.put(EventName.ON_SDK_INIT, EventMessageType.MESSAGE);
        this.nameToMessageTypeMap.put(EventName.ON_SDK_DISCONNECT, EventMessageType.MESSAGE);
        this.nameToMessageTypeMap.put(EventName.ON_SESSION_ID_RECEIVE, EventMessageType.MESSAGE);
        this.nameToMessageTypeMap.put(EventName.ON_COMMAND_SENT_SUCCESSFULLY, EventMessageType.MESSAGE);
        this.nameToMessageTypeMap.put(EventName.ON_NEW_INTENT_SUCCESS, EventMessageType.MESSAGE);
    }

    public EventMessage create(EventName eventName, Object payload) {
        String messageJsonString;

        try {
            messageJsonString = this.createJson(eventName, payload);
        } catch (EventMessageEmittingException e) {
            return new EventMessage(
                EventName.ON_ERROR,
                EventMessageType.ERROR,
                this.createJson(EventName.ON_ERROR, e.getClass().getSimpleName())
            );
        }

        return new EventMessage(
            eventName,
            this.nameToMessageTypeMap.get(eventName),
            messageJsonString
        );
    }

    private String createJson(
        EventName eventName,
        Object payload
    ) throws EventMessageEmittingException {
        JSONObject jsonObject = new JSONObject();

        try {
            jsonObject.put(
                Objects.requireNonNull(this.nameToMessageTypeMap.get(eventName)).value,
                payload
            );
        } catch (JSONException | NullPointerException e) {
            String errorMessage = String.format(
                "Payload to JSON encoding process failed. Payload: '%s'",
                payload.toString()
            );

            Log.e(EventMessageFactory.class.getSimpleName(), errorMessage);

            throw new EventMessageEmittingException(errorMessage);
        }

        return jsonObject.toString();
    }
}
