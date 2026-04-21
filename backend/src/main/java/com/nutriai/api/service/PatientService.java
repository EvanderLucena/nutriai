package com.nutriai.api.service;

import com.nutriai.api.dto.patient.*;
import com.nutriai.api.exception.ResourceNotFoundException;
import com.nutriai.api.model.Episode;
import com.nutriai.api.model.Patient;
import com.nutriai.api.model.PatientObjective;
import com.nutriai.api.model.PatientStatus;
import com.nutriai.api.repository.EpisodeRepository;
import com.nutriai.api.repository.NutritionistRepository;
import com.nutriai.api.repository.PatientRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.UUID;

@Service
public class PatientService {

    private final PatientRepository patientRepository;
    private final EpisodeRepository episodeRepository;
    private final NutritionistRepository nutritionistRepository;

    public PatientService(PatientRepository patientRepository,
                          EpisodeRepository episodeRepository,
                          NutritionistRepository nutritionistRepository) {
        this.patientRepository = patientRepository;
        this.episodeRepository = episodeRepository;
        this.nutritionistRepository = nutritionistRepository;
    }

    @Transactional
    public PatientResponse createPatient(UUID nutritionistId, CreatePatientRequest req) {
        nutritionistRepository.findById(nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Nutricionista", nutritionistId));

        PatientObjective objective = parseObjective(req.objective());

        Patient patient = Patient.builder()
                .nutritionistId(nutritionistId)
                .name(req.name())
                .initials(computeInitials(req.name()))
                .age(req.age())
                .objective(objective)
                .weight(req.weight())
                .build();

        Patient saved = patientRepository.save(patient);

        Episode episode = Episode.builder()
                .patientId(saved.getId())
                .build();
        episodeRepository.save(episode);

        return PatientResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public PatientListResponse listPatients(UUID nutritionistId, String search, PatientStatus status,
                                              PatientObjective objective, Boolean active, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);

        String escapedSearch = search != null ? escapeLike(search) : null;
        boolean hasFilter = escapedSearch != null || status != null || objective != null || active != null;

        if (hasFilter) {
            Page<Patient> result = patientRepository.findByNutritionistIdWithFilters(
                    nutritionistId, escapedSearch, status, objective, active, pageRequest);
            return PatientListResponse.from(result);
        }

        Page<Patient> result = patientRepository.findByNutritionistId(nutritionistId, pageRequest);
        return PatientListResponse.from(result);
    }

    @Transactional(readOnly = true)
    public PatientResponse getPatient(UUID id, UUID nutritionistId) {
        Patient patient = patientRepository.findByIdAndNutritionistId(id, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", id));
        return PatientResponse.from(patient);
    }

    @Transactional
    public PatientResponse updatePatient(UUID id, UUID nutritionistId, UpdatePatientRequest req) {
        Patient patient = patientRepository.findByIdAndNutritionistId(id, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", id));

        if (req.name() != null) {
            patient.setName(req.name());
            patient.setInitials(patient.getName() != null ? computeInitials(req.name()) : null);
        }
        if (req.age() != null) patient.setAge(req.age());
        if (req.objective() != null) patient.setObjective(parseObjective(req.objective()));
        if (req.status() != null) patient.setStatus(parseStatus(req.status()));
        if (req.weight() != null) patient.setWeight(req.weight());
        if (req.weightDelta() != null) patient.setWeightDelta(req.weightDelta());
        if (req.adherence() != null) patient.setAdherence(req.adherence());
        if (req.tag() != null) patient.setTag(req.tag());

        Patient updated = patientRepository.save(patient);
        return PatientResponse.from(updated);
    }

    @Transactional
    public PatientResponse deactivatePatient(UUID id, UUID nutritionistId) {
        Patient patient = patientRepository.findByIdAndNutritionistId(id, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", id));

        patient.softDelete();
        episodeRepository.findTopByPatientIdAndEndDateIsNullOrderByStartDateDesc(patient.getId())
                .ifPresent(Episode::close);

        Patient updated = patientRepository.save(patient);
        return PatientResponse.from(updated);
    }

    @Transactional
    public PatientResponse reactivatePatient(UUID id, UUID nutritionistId) {
        Patient patient = patientRepository.findByIdAndNutritionistId(id, nutritionistId)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente", id));

        patient.reactivate();

        Episode episode = Episode.builder()
                .patientId(patient.getId())
                .build();
        episodeRepository.save(episode);

        Patient updated = patientRepository.save(patient);
        return PatientResponse.from(updated);
    }

    private String computeInitials(String name) {
        if (name == null || name.isBlank()) return "";
        String[] words = name.trim().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < Math.min(words.length, 2); i++) {
            if (!words[i].isEmpty()) sb.append(Character.toUpperCase(words[i].charAt(0)));
        }
        return sb.toString();
    }

    /**
     * Escape SQL LIKE special characters (% and _) for safe wildcard search.
     */
    private String escapeLike(String search) {
        if (search == null) return null;
        return search.replace("!", "!!")
                .replace("%", "!%")
                .replace("_", "!_");
    }

    /**
     * Validates and parses a PatientObjective enum value, throwing 400 for invalid values.
     */
    private PatientObjective parseObjective(String value) {
        try {
            return PatientObjective.valueOf(value);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Objetivo inválido. Valores permitidos: " + Arrays.toString(PatientObjective.values()));
        }
    }

    /**
     * Validates and parses a PatientStatus enum value, throwing 400 for invalid values.
     */
    private PatientStatus parseStatus(String value) {
        try {
            return PatientStatus.valueOf(value);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Status inválido. Valores permitidos: " + Arrays.toString(PatientStatus.values()));
        }
    }
}