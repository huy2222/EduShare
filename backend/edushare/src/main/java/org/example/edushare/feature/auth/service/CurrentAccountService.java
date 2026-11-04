package org.example.edushare.feature.auth.service;

import lombok.RequiredArgsConstructor;
import org.example.edushare.feature.user.repository.UserRepository;
import org.example.edushare.feature.user.entity.UserStatus;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.StringJoiner;

@Service
@RequiredArgsConstructor
public class CurrentAccountService {
    private final UserRepository users;

    @Transactional(readOnly = true)
    public String scope(String email) {
        var user = users.findForAuthorization(email).orElseThrow(() -> new BadJwtException("Account no longer exists"));
        return buildScope(user);
    }

    @Transactional(readOnly = true)
    public String scope(String email, String tokenId) {
        var user = users.findForTokenAuthorization(email, tokenId)
                .orElseThrow(() -> new BadJwtException("Account does not exist or token has been revoked"));
        return buildScope(user);
    }

    private String buildScope(org.example.edushare.feature.user.entity.User user) {
        if (user.getStatus() != UserStatus.ACTIVE) throw new BadJwtException("Account is disabled");
        StringJoiner scope = new StringJoiner(" ");
        user.getRoles().forEach(role -> {
            if (!role.isActive()) return;
            scope.add("ROLE_" + role.getName());
            role.getPermissions().forEach(permission -> scope.add(permission.getName()));
        });
        return scope.toString();
    }
}
