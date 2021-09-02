package com.jolocom.reactlibrary.exception;

/**
 * Thrown when SDK command sending failed.
 */
public class SendCommandException extends RuntimeException {
    public SendCommandException(String message) {
        super(message);
    }
}
