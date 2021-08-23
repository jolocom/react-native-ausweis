package com.jolocom.reactlibrary.exception;

/**
 * Thrown when something goes wrong on the SDK level.
 */
public class SdkInternalException extends RuntimeException {
    public SdkInternalException(String message, Throwable cause) {
        super(message, cause);
    }
}
