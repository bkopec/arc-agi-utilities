package com.bkopec.arcAgiBackend.controller;

import com.bkopec.arcAgiBackend.service.ArcAgiDatasetService;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/")
@Slf4j
public class ArcAgiDatasetController {

    private final ArcAgiDatasetService arcAgiDatasetService;

    public ArcAgiDatasetController(ArcAgiDatasetService arcAgiDatasetService) {
        this.arcAgiDatasetService = arcAgiDatasetService;
    }

    @GetMapping("/refreshDataset")
    public ResponseEntity<String> cloneOrPullDataset() {
        try {
            String path = arcAgiDatasetService.cloneOrPullDataset();
            return ResponseEntity.ok("ARC-AGI dataset cloned/pulled to: " + path);
        } catch (GitAPIException | IOException e) {
            log.error("Failed to clone or pull ARC-AGI dataset", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to clone or pull dataset: " + e.getMessage());
        }
    }

    @GetMapping("/tasks")
    public ResponseEntity<List<String>> listAllArcAgiTaskNames() {
        try {
            List<String> taskNames = arcAgiDatasetService.listAllArcAgiTaskNames();
            return ResponseEntity.ok(taskNames);
        } catch (IOException e) {
            log.error("Failed to list all ARC-AGI task names.", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(List.of("Failed to list tasks: " + e.getMessage()));
        }
    }

    @GetMapping(value = "/task/{fileName}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getArcAgiTaskJson(@PathVariable String fileName) {
        try {
            String jsonContent = arcAgiDatasetService.findArcAgiTaskJson(fileName);
            return ResponseEntity.ok(jsonContent);
        } catch (IOException e) {
            log.warn("ARC-AGI task file not found or could not be read: {}", fileName);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("ARC-AGI task file not found or inaccessible: " + e.getMessage());
        }
    }

    @GetMapping("/task-sets/all")
    public ResponseEntity<Map<String, List<String>>> getAllHardcodedTaskSets() throws IOException { // Declare throws IOException
        log.info("Request received for all hardcoded task sets.");
        try {
            Map<String, List<String>> allSets = arcAgiDatasetService.getHardCodedTaskSets();
            return ResponseEntity.ok(allSets);
        } catch (IOException e) {
            log.error("Error retrieving all hardcoded task sets: {}", e.getMessage(), e);
            throw e;
        }
    }
}