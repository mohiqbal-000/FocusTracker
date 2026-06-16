package com.example.FocusTrackerBackend.Service;

import com.example.FocusTrackerBackend.Dto.TagDto;
import com.example.FocusTrackerBackend.Dto.TagStatsDto;
import com.example.FocusTrackerBackend.Repository.FocusRepository;
import com.example.FocusTrackerBackend.Repository.TagRepository;
import com.example.FocusTrackerBackend.model.FocusSessions;
import com.example.FocusTrackerBackend.model.Tag;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class TagService {

    private final TagRepository tagRepo;
    private final FocusRepository focusRepo;

    public TagService(TagRepository tagRepo, FocusRepository focusRepo) {
        this.tagRepo = tagRepo;
        this.focusRepo = focusRepo;
    }

    // ── Create a new tag ─────────────────────────────────────────────────────

    public TagDto createTag(TagDto dto) {
        if (tagRepo.existsByNameIgnoreCase(dto.getName())) {
            throw new RuntimeException("Tag '" + dto.getName() + "' already exists");
        }
        Tag tag = new Tag(dto.getName().toLowerCase().trim(), dto.getColor());
        Tag saved = tagRepo.save(tag);
        return toDto(saved);
    }

    // ── Get all available tags ────────────────────────────────────────────────

    public List<TagDto> getAllTags() {
        return tagRepo.findAll()
                .stream()
                .map(this::toDto)
                .toList();
    }

    // ── Delete a tag by id ────────────────────────────────────────────────────

    public void deleteTag(Long tagId) {
        Tag tag = tagRepo.findById(tagId)
                .orElseThrow(() -> new RuntimeException("Tag not found"));
        tagRepo.delete(tag);
        // Sessions that had this tag will have tag set to null (nullable FK)
    }

    // ── Assign a tag to a session ─────────────────────────────────────────────

    public Tag resolveTag(String tagName) {
        return tagRepo.findByNameIgnoreCase(tagName)
                .orElseThrow(() -> new RuntimeException(
                        "Tag '" + tagName + "' not found. Create it first via POST /api/tags"));
    }

    // ── Per-tag focus stats for a user ────────────────────────────────────────

    public List<TagStatsDto> getTagStats(Long userId) {
        List<FocusSessions> all = focusRepo.findByUser_Id(userId)
                .stream()
                .filter(FocusSessions::isCompleted)
                .toList();

        long grandTotal = all.stream().mapToLong(FocusSessions::getDuration).sum();

        // Group completed sessions by tag name (null tags grouped as "untagged")
        Map<String, List<FocusSessions>> grouped = all.stream()
                .collect(Collectors.groupingBy(s ->
                        s.getTag() != null ? s.getTag().getName() : "untagged"));

        return grouped.entrySet().stream()
                .map(entry -> {
                    String name = entry.getKey();
                    List<FocusSessions> sessions = entry.getValue();
                    long minutes = sessions.stream().mapToLong(FocusSessions::getDuration).sum();
                    String color = sessions.stream()
                            .filter(s -> s.getTag() != null)
                            .map(s -> s.getTag().getColor())
                            .findFirst()
                            .orElse(null);
                    double pct = grandTotal > 0
                            ? Math.round((minutes * 1000.0 / grandTotal)) / 10.0
                            : 0.0;
                    return new TagStatsDto(name, color, sessions.size(), minutes, pct);
                })
                .sorted((a, b) -> Long.compare(b.getTotalMinutes(), a.getTotalMinutes()))
                .toList();
    }

    private TagDto toDto(Tag tag) {
        return new TagDto(tag.getId(), tag.getName(), tag.getColor());
    }
}