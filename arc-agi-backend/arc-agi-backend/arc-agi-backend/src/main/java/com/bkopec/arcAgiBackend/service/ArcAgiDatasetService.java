
package com.bkopec.arcAgiBackend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@Slf4j
public class ArcAgiDatasetService {

    @Value("${arc.agi.dataset.repo.url}")
    private String arcAgiRepoUrl;

    @Value("${arc.agi.dataset.local.path:./arc_dataset}")
    private String arcAgiLocalPath;

    private final ResourceLoader resourceLoader;
    private final ObjectMapper objectMapper;

    public ArcAgiDatasetService(ResourceLoader resourceLoader, ObjectMapper objectMapper) {
        this.resourceLoader = resourceLoader;
        this.objectMapper = objectMapper;
    }


    public Map<String, List<String>> getHardCodedTaskSets() throws IOException {
        log.info("Loading hardcoded task sets dynamically...");
        Map<String, List<String>> taskSets = new HashMap<>();

        Map<String, String> setFileNames = new HashMap<>();
        setFileNames.put("ARC-AGI-2 Training", "newTraining.json");
        setFileNames.put("ARC-AGI-2 Evaluation", "newEval.json");
        setFileNames.put("ARC-AGI-1 Training", "oldEval.json");
        setFileNames.put("ARC-AGI-1 Evaluation", "oldTraining.json");

        for (Map.Entry<String, String> entry : setFileNames.entrySet()) {
            String setName = entry.getKey();
            String fileName = entry.getValue();
            try {
                Resource resource = resourceLoader.getResource("classpath:tasksSets/" + fileName);
                if (resource.exists() && resource.isReadable()) {
                    List<String> tasks = objectMapper.readValue(resource.getInputStream(), new TypeReference<List<String>>() {});
                    taskSets.put(setName, tasks);
                    log.debug("Successfully loaded hardcoded task set '{}' from '{}' ({} tasks).", setName, fileName, tasks.size());
                } else {
                    log.error("Hardcoded task set file not found or not readable: {}", fileName);
                    throw new IOException("Required task set file not found: " + fileName);
                }
            } catch (IOException e) {
                log.error("Error loading hardcoded task set '{}' from '{}': {}", setName, fileName, e.getMessage());
                throw e;
            }
        }
        log.info("Successfully loaded all hardcoded task sets ({} sets).", taskSets.size());
        return taskSets;
    }


    public String cloneOrPullDataset() throws IOException, GitAPIException {
        File localRepoDir = new File(arcAgiLocalPath);

        if (localRepoDir.exists() && localRepoDir.isDirectory()) {
            Path gitDirPath = Paths.get(localRepoDir.getAbsolutePath(), ".git");
            if (Files.exists(gitDirPath) && Files.isDirectory(gitDirPath)) {
                log.info("Local ARC-AGI repository already exists at {}. Attempting to pull latest changes...", arcAgiLocalPath);
                try (Git git = Git.open(localRepoDir)) {
                    git.pull().call();
                    log.info("Successfully pulled latest changes for ARC-AGI dataset.");
                }
            } else {
                log.warn("Directory {} exists but is not a Git repository. Deleting and cloning...", arcAgiLocalPath);
                try (Stream<Path> walk = Files.walk(localRepoDir.toPath())) {
                    walk.sorted(java.util.Comparator.reverseOrder())
                            .map(Path::toFile)
                            .forEach(File::delete);
                }
                cloneRepo(localRepoDir);
            }
        } else {
            log.info("Local ARC-AGI repository does not exist at {}. Cloning...", arcAgiLocalPath);
            cloneRepo(localRepoDir);
        }
        return arcAgiLocalPath;
    }

    private void cloneRepo(File localRepoDir) throws GitAPIException {
        try {
            Git.cloneRepository()
                    .setURI(arcAgiRepoUrl)
                    .setDirectory(localRepoDir)
                    .call();
            log.info("Successfully cloned ARC-AGI dataset to {}.", arcAgiLocalPath);
        } catch (GitAPIException e) {
            log.error("Failed to clone ARC-AGI repository from {}: {}", arcAgiRepoUrl, e.getMessage());
            throw e;
        }
    }

    public List<String> listArcAgiTaskNames(String datasetType) throws IOException {
        Path targetPath = Paths.get(arcAgiLocalPath, "data", datasetType);
        if (!Files.exists(targetPath) || !Files.isDirectory(targetPath)) {
            log.warn("ARC-AGI dataset directory not found or not a directory: {}. Have you cloned the repository?", targetPath);
            return List.of();
        }

        try (Stream<Path> paths = Files.walk(targetPath, 1)) {
            return paths
                    .filter(Files::isRegularFile)
                    .filter(p -> p.toString().endsWith(".json"))
                    .map(p -> p.getFileName().toString())
                    .collect(Collectors.toList());
        }
    }


    public List<String> listAllArcAgiTaskNames() throws IOException {
        List<String> allTaskNames = new ArrayList<>();
        allTaskNames.addAll(listArcAgiTaskNames("training"));
        allTaskNames.addAll(listArcAgiTaskNames("evaluation"));
        return allTaskNames;
    }

    public String findArcAgiTaskJson(String fileName) throws IOException {
        if (!fileName.endsWith(".json"))
            fileName += ".json";
        if (fileName.contains("..") || fileName.contains("/")) {
            throw new IOException("Invalid filename: " + fileName);
        }

        Path trainingFilePath = Paths.get(arcAgiLocalPath, "data", "training", fileName);
        if (Files.exists(trainingFilePath) && Files.isRegularFile(trainingFilePath)) {
            log.info("Found task '{}' in 'training' directory.", fileName);
            return Files.readString(trainingFilePath);
        }

        Path evaluationFilePath = Paths.get(arcAgiLocalPath, "data", "evaluation", fileName);
        if (Files.exists(evaluationFilePath) && Files.isRegularFile(evaluationFilePath)) {
            log.info("Found task '{}' in 'evaluation' directory.", fileName);
            return Files.readString(evaluationFilePath);
        }

        throw new IOException("ARC-AGI task file not found in 'training' or 'evaluation' directories: " + fileName);
    }
}