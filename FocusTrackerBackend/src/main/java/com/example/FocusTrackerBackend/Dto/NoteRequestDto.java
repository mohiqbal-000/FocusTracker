package com.example.FocusTrackerBackend.Dto;

import jakarta.validation.constraints.Size;

public class NoteRequestDto {

    @Size(max = 500, message = "Note must be 500 characters or fewer")
    private String note;

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}