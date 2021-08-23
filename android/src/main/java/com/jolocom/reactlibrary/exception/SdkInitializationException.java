package com.jolocom.reactlibrary.exception;

/**
 * Thrown when something goes wrong in the process of SDK initialization.
 */
public class SdkInitializationException extends RuntimeException {
    public SdkInitializationException(String message) {
        super(message);
    }

    public SdkInitializationException(String message, Throwable cause) {
        super(message, cause);
    }
}
