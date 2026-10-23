package org.example.edushare.feature.auth.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.example.edushare.feature.user.entity.UserStatus;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RegisterResponse{
    String id;
    String fullName;
    String email;
    UserStatus status;
    LocalDateTime createdAt;
}
