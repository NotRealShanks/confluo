package com.github.notrealshanks.confluobackend.exception;

public class OAuthLoginException extends RuntimeException {

    private final String code;

    public OAuthLoginException(String code) {
        super(code);
        this.code = code;
    }

    // Short machine-readable code the frontend maps to a message
    public String getCode() {
        return code;
    }
}