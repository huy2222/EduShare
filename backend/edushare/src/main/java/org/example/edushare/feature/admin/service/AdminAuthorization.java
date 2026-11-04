package org.example.edushare.feature.admin.service;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import java.util.*;

@Component("adminAuthorization")
public class AdminAuthorization {
    public boolean has(String... codes) {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) return false;
        Set<String> granted = new HashSet<>();
        authentication.getAuthorities().forEach(a -> granted.add(a.getAuthority()));
        return granted.contains("ROLE_ADMIN") || Arrays.stream(codes).anyMatch(granted::contains);
    }
    public boolean catalog(String type, boolean options) {
        String prefix = switch (type) { case "faculties" -> "FACULTY"; case "majors" -> "MAJOR"; case "subjects" -> "SUBJECT"; default -> "INVALID"; };
        if (has("CATALOG_VIEW", "CATALOG_MANAGE", prefix + "_VIEW", prefix + "_CREATE", prefix + "_UPDATE", prefix + "_DELETE")) return true;
        // Forms may read lightweight references without gaining access to unrelated tables/details.
        return options && (type.equals("faculties") && has("MAJOR_CREATE", "MAJOR_UPDATE", "SUBJECT_CREATE", "SUBJECT_UPDATE")
                || type.equals("majors") && has("SUBJECT_CREATE", "SUBJECT_UPDATE"));
    }
    public boolean documentAction(org.example.edushare.feature.document.entity.ModerationAction action) {
        if (action == null) return false;
        return has("APPROVE_DOCUMENT", switch (action) {
            case APPROVED -> "DOCUMENT_APPROVE";
            case REJECTED -> "DOCUMENT_REJECT";
            case HIDDEN -> "DOCUMENT_HIDE";
        });
    }
}
