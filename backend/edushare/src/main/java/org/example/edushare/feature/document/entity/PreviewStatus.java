package org.example.edushare.feature.document.entity;

/** Lifecycle of the private PDF copy used by moderators. */
public enum PreviewStatus {
    NOT_REQUIRED,
    PENDING,
    CONVERTING,
    AVAILABLE,
    FAILED
}
