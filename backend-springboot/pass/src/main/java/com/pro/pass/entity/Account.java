package com.pro.pass.entity;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table (name = "account")
public class Account {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column (name = "username", nullable = false, unique = false)
    private String username;

    @Column (name = "email", nullable = false, unique = true)
    private String email;

    @Column (name = "password", nullable = false, unique = false)
    private String password;

    @Column (name = "creazioneAccount", nullable = false, unique = false)
    private LocalDate creazioneAccount;

    // ----------------------- COSTRUTTORI -----------------------

    public Account(Long id, String username, String email, String password, LocalDate creazioneAccount) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.password = password;
        this.creazioneAccount = creazioneAccount;
    }

    public Account() {}

    // ----------------------- GETTER & SETTER -----------------------

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public LocalDate getCreazioneAccount() {
        return creazioneAccount;
    }

    public void setCreazioneAccount(LocalDate creazioneAccount) {
        this.creazioneAccount = creazioneAccount;
    }
}
