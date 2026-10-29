package org.example.edushare.config;

import lombok.RequiredArgsConstructor;
import org.example.edushare.feature.academic.entity.Faculty;
import org.example.edushare.feature.academic.entity.Major;
import org.example.edushare.feature.academic.entity.Subject;
import org.example.edushare.feature.academic.repository.FacultyRepository;
import org.example.edushare.feature.academic.repository.MajorRepository;
import org.example.edushare.feature.academic.repository.SubjectRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class AcademicDataInitializer implements ApplicationRunner {

    private final FacultyRepository facultyRepository;
    private final MajorRepository majorRepository;
    private final SubjectRepository subjectRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Faculty informationTechnology = getOrCreateFaculty(
                "FIT", "Khoa Công nghệ Thông tin", "Đào tạo và nghiên cứu trong lĩnh vực công nghệ thông tin."
        );
        Faculty electricalEngineering = getOrCreateFaculty(
                "FEE", "Khoa Điện - Điện tử", "Đào tạo các ngành điện, điện tử và tự động hóa."
        );
        Faculty economics = getOrCreateFaculty(
                "FBE", "Khoa Kinh tế", "Đào tạo các ngành kinh tế, quản trị và kinh doanh."
        );

        Major softwareEngineering = getOrCreateMajor(
                "SE", "Kỹ thuật Phần mềm", "Phát triển và vận hành hệ thống phần mềm.", informationTechnology
        );
        Major informationSystems = getOrCreateMajor(
                "IS", "Hệ thống Thông tin", "Phân tích, xây dựng và quản trị hệ thống thông tin.", informationTechnology
        );
        Major computerScience = getOrCreateMajor(
                "CS", "Khoa học Máy tính", "Nghiên cứu nền tảng tính toán, dữ liệu và trí tuệ nhân tạo.", informationTechnology
        );
        Major electricalEngineeringMajor = getOrCreateMajor(
                "EE", "Kỹ thuật Điện - Điện tử", "Thiết kế và vận hành các hệ thống điện, điện tử.", electricalEngineering
        );
        Major businessAdministration = getOrCreateMajor(
                "BA", "Quản trị Kinh doanh", "Quản trị doanh nghiệp, tài chính và hoạt động kinh doanh.", economics
        );

        Subject dataStructures = getOrCreateSubject(
                "INT1301", "Cấu trúc dữ liệu và Giải thuật", "Cấu trúc dữ liệu cơ bản và kỹ thuật thiết kế giải thuật.", 3
        );
        Subject objectOrientedProgramming = getOrCreateSubject(
                "INT1306", "Lập trình hướng đối tượng", "Nguyên lý và thực hành lập trình hướng đối tượng.", 3
        );
        Subject databases = getOrCreateSubject(
                "INT1415", "Cơ sở dữ liệu", "Mô hình dữ liệu, SQL và thiết kế cơ sở dữ liệu.", 3
        );
        Subject circuitTheory = getOrCreateSubject(
                "EEE1201", "Lý thuyết mạch", "Phân tích các mạch điện cơ bản.", 3
        );
        Subject managementPrinciples = getOrCreateSubject(
                "BUS1101", "Nguyên lý quản trị", "Các nguyên lý nền tảng trong quản trị tổ chức.", 3
        );

        linkSubject(softwareEngineering, dataStructures);
        linkSubject(softwareEngineering, objectOrientedProgramming);
        linkSubject(softwareEngineering, databases);
        linkSubject(informationSystems, dataStructures);
        linkSubject(informationSystems, databases);
        linkSubject(computerScience, dataStructures);
        linkSubject(computerScience, objectOrientedProgramming);
        linkSubject(electricalEngineeringMajor, circuitTheory);
        linkSubject(businessAdministration, managementPrinciples);
    }

    private Faculty getOrCreateFaculty(String code, String name, String description) {
        return facultyRepository.findByCode(code)
                .orElseGet(() -> facultyRepository.save(Faculty.builder()
                        .code(code)
                        .name(name)
                        .description(description)
                        .build()));
    }

    private Major getOrCreateMajor(String code, String name, String description, Faculty faculty) {
        return majorRepository.findByCode(code)
                .orElseGet(() -> majorRepository.save(Major.builder()
                        .code(code)
                        .name(name)
                        .description(description)
                        .faculty(faculty)
                        .build()));
    }

    private Subject getOrCreateSubject(String code, String name, String description, int credits) {
        return subjectRepository.findByCode(code)
                .orElseGet(() -> subjectRepository.save(Subject.builder()
                        .code(code)
                        .name(name)
                        .description(description)
                        .credits(credits)
                        .build()));
    }

    private void linkSubject(Major major, Subject subject) {
        boolean linked = major.getSubjects().stream()
                .anyMatch(existingSubject -> existingSubject.getId().equals(subject.getId()));
        if (!linked) {
            major.addSubject(subject);
            majorRepository.save(major);
        }
    }
}
