package com.jolocom.reactlibrary.exception;

/**
 * Thrown on attempts to access sdk when it's not initialized yet.
 */
public class SdkNotInitializedException extends RuntimeException {
    public SdkNotInitializedException(String message) {
        super(message);
    }
}
