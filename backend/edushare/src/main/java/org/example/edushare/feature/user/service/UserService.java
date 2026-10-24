package org.example.edushare.feature.user.service;


import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.example.edushare.common.exception.AppException;
import org.example.edushare.common.exception.ErrorCode;
import org.example.edushare.feature.auth.entity.Role;
import org.example.edushare.feature.auth.repository.RoleRepository;
import org.example.edushare.feature.user.dto.request.UserCreationRequest;
import org.example.edushare.feature.user.dto.response.UserResponse;
import org.example.edushare.feature.user.entity.User;
import org.example.edushare.feature.user.mapper.UserMapper;
import org.example.edushare.feature.user.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserService {
    UserRepository userRepository;
    UserMapper userMapper;
    RoleRepository roleRepository;
    PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public UserResponse getMyInfo() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        Set<String> roles = user.getRoles() == null
                ? Set.of()
                : user.getRoles().stream().map(Role::getName).collect(Collectors.toUnmodifiableSet());
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getProfile() == null ? null : user.getProfile().getFullName())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .roles(roles)
                .build();
    }

//    public UserResponse createUser(UserCreationRequest request) {
//        log.info("User service create");
//        User user = userMapper.toUser(request);
//        user.setPassword(passwordEncoder.encode(request.getPassword()));
//
//        Role role = roleRepository.findByName("USER").orElseThrow(() -> new RuntimeException("Role not found"));
//        user.setRoles(new HashSet<>(List.of(role)));
//
//        try {
//            user = userRepository.save(user);
//        } catch (DataIntegrityViolationException e) {
//            throw new AppException(ErrorCode.USER_EXISTED);
//        }
//
//        return userMapper.toUserResponse(user);
//    }

//    public UserResponse updateUser(String userId, UserUpdateRequest request) {
//        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
//        userMapper.updateUser(user, request);
//
//        user.setPassword(passwordEncoder.encode(request.getPassword()));
//        var roles = roleRepository.findAllById(request.getRoles());
//        user.setRoles(new HashSet<>(roles));
//        log.info("Updating user with ROLES: {}", roles);
//        return userMapper.toUserResponse(userRepository.save(user));
//    }
//
//    public UserResponse getMyInfo() {
//        var securityContext = SecurityContextHolder.getContext();
//        String username = securityContext.getAuthentication().getName();
//        User user =
//                userRepository.findByUsername(username).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
//        return userMapper.toUserResponse(user);
//    }
//
//    public void deleteUser(String userId) {
//        userRepository.deleteById(userId);
//    }
//
//    @PreAuthorize("hasRole('ADMIN')")
//    //    @PreAuthorize("hasAuthority('APPROVE_POST')")
//    public List<UserResponse> getUsers() {
//        return userMapper.toUserResponse(userRepository.findAll());
//    }
//
//    @PostAuthorize("returnObject.username == authentication.name")
//    public UserResponse getUser(String id) {
//        return userMapper.toUserResponse(
//                userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found")));
//    }
}
