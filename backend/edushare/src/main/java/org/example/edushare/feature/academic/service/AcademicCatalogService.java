package org.example.edushare.feature.academic.service;

import lombok.RequiredArgsConstructor;
import org.example.edushare.feature.academic.dto.FacultyOptionResponse;
import org.example.edushare.feature.academic.dto.MajorOptionResponse;
import org.example.edushare.feature.academic.dto.SubjectOptionResponse;
import org.example.edushare.feature.academic.entity.Faculty;
import org.example.edushare.feature.academic.entity.Major;
import org.example.edushare.feature.academic.entity.Subject;
import org.example.edushare.feature.academic.repository.FacultyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AcademicCatalogService {

    private final FacultyRepository facultyRepository;

    @Transactional(readOnly = true)
    public List<FacultyOptionResponse> getFaculties() {
        return facultyRepository.findAll().stream()
                .sorted(Comparator.comparing(Faculty::getName))
                .map(this::toFacultyResponse)
                .toList();
    }

    private FacultyOptionResponse toFacultyResponse(Faculty faculty) {
        List<MajorOptionResponse> majors = faculty.getMajors().stream()
                .sorted(Comparator.comparing(Major::getName))
                .map(this::toMajorResponse)
                .toList();

        return FacultyOptionResponse.builder()
                .id(faculty.getId())
                .code(faculty.getCode())
                .name(faculty.getName())
                .majors(majors)
                .build();
    }

    private MajorOptionResponse toMajorResponse(Major major) {
        List<SubjectOptionResponse> subjects = major.getSubjects().stream()
                .sorted(Comparator.comparing(Subject::getCode))
                .map(subject -> SubjectOptionResponse.builder()
                        .id(subject.getId())
                        .code(subject.getCode())
                        .name(subject.getName())
                        .credits(subject.getCredits())
                        .build())
                .toList();

        return MajorOptionResponse.builder()
                .id(major.getId())
                .code(major.getCode())
                .name(major.getName())
                .subjects(subjects)
                .build();
    }
}
