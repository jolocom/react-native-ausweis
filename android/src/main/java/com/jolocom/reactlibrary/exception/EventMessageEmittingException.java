package com.jolocom.reactlibrary.exception;

/**
 * Thrown when some problem occurred in process of event message emitting.
 */
public class EventMessageEmittingException extends RuntimeException {
    public EventMessageEmittingException(String message) {
        super(message);
    }
}
