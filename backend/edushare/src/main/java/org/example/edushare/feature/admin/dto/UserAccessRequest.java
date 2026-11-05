package org.example.edushare.feature.admin.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.Set;
import org.example.edushare.feature.user.entity.UserStatus;

public record UserAccessRequest(@NotEmpty Set<String> roles, @NotNull UserStatus status) {}
