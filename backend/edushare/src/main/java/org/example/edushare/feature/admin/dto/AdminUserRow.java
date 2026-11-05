package org.example.edushare.feature.admin.dto;

import java.time.LocalDateTime;
import org.example.edushare.feature.user.entity.UserStatus;

public record AdminUserRow(String id, String email, String fullName, UserStatus status, LocalDateTime createdAt) {}
