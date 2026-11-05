package org.example.edushare.feature.admin.dto;

public record ManagedRoleRow(String id, String code, String displayName, String description,
        boolean active, long userCount, long permissionCount) {}
