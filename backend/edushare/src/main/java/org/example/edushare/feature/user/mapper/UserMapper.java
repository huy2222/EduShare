package org.example.edushare.feature.user.mapper;

import org.example.edushare.feature.auth.dto.request.RegisterRequest;
import org.example.edushare.feature.auth.dto.response.RegisterResponse;
import org.example.edushare.feature.user.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface UserMapper {
    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "profile", ignore = true)
    User toUser(RegisterRequest request);

    @Mapping(target = "fullName", source = "profile.fullName")
    RegisterResponse toUserResponse(User user);

    List<RegisterResponse> toUserResponse(List<User> users);
//
//    @Mapping(target = "roles", ignore = true)
//    void updateUser(@MappingTarget User user, UserUpdateRequest request);
}
