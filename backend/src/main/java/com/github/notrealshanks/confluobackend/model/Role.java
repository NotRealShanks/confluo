package com.github.notrealshanks.confluobackend.model;

public enum Role {
    OWNER,
    EDITOR,
    VIEWER;

    public boolean canEdit() {
        return this != VIEWER;
    }

    public boolean canManageMembers() {
        return this == OWNER;
    }
}