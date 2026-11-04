package org.example.edushare.feature.auth.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Column;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Set;
import java.util.HashSet;

@Builder
@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Role {
    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.UUID)
    String id;

    @Column(nullable = false, unique = true, length = 100)
    String name;

    @Column(length = 500)
    String description;

    @Column(length = 100)
    String displayName;

    @Column(nullable = false, columnDefinition = "boolean default true")
    @Builder.Default
    boolean active = true;

    @ManyToMany
    @Builder.Default
    Set<Permission> permissions = new HashSet<>();
}
