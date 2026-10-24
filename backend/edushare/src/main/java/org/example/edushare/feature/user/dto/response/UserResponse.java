package org.example.edushare.feature.user.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.example.edushare.feature.user.entity.UserStatus;

import java.time.LocalDateTime;
import java.util.Set;
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {
    String id;
    String fullName;
    String email;
    UserStatus status;
    LocalDateTime createdAt;
    Set<String> roles;
}

