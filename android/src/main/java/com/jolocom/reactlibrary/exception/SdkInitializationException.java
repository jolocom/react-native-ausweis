package com.jolocom.reactlibrary.exception;

/**
 * Thrown when something goes wrong in the process of SDK initialization.
 */
public class SdkInitializationException extends RuntimeException {
    public static final String DEFAULT_ERROR_MESSAGE = "Service connection failed.";

    public SdkInitializationException() {
        super(DEFAULT_ERROR_MESSAGE);
    }

    public SdkInitializationException(Throwable cause) {
        super(DEFAULT_ERROR_MESSAGE, cause);
    }

    public SdkInitializationException(String message, Throwable cause) {
        super(message, cause);
    }
}
