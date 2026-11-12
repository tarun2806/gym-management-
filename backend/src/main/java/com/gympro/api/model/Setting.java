package com.gympro.api.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "settings")
@Getter @Setter
public class Setting {

    @Id
    @Column(name = "`key`", length = 100)
    private String key;

    @Column(columnDefinition = "json")
    private String value;
}
