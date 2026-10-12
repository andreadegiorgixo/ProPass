package com.pro.pass.entity;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table (name = "password")
public class Password {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column (name = "nomePassword", nullable = false, unique = false)
    private String nomePassword;

    @Column (name = "password", nullable = false, unique = false)
    private String password;

    @Column (name = "link", nullable = false, unique = false)
    private String link;

    @Column (name = "username", nullable = false, unique = false)
    private String username;

    // Facoltative: Oracle salva la stringa vuota come NULL, quindi la colonna deve accettarlo.
    @Column (name = "note", nullable = true, unique = false)
    private String note;

    @Column (name = "creazionePassword", nullable = false, unique = false)
    private LocalDate creazionePassword;

    @JoinColumn (name = "account_id", nullable = false)
    @ManyToOne
    private Account idAccount;

    // ----------------------- COSTRUTTORI -----------------------

    public Password() {
    }

    public Password(String nomePassword, String password, String link, String username, String note, LocalDate creazionePassword, Account idAccount) {
        this.nomePassword = nomePassword;
        this.password = password;
        this.link = link;
        this.username = username;
        this.note = note;
        this.creazionePassword = creazionePassword;
        this.idAccount = idAccount;
    }

    // ----------------------- GETTER & SETTER -----------------------

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNomePassword() {
        return nomePassword;
    }

    public void setNomePassword(String nomePassword) {
        this.nomePassword = nomePassword;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getLink() {
        return link;
    }

    public void setLink(String link) {
        this.link = link;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public LocalDate getCreazionePassword() {
        return creazionePassword;
    }

    public void setCreazionePassword(LocalDate creazionePassword) {
        this.creazionePassword = creazionePassword;
    }

    public Account getIdAccount() {
        return idAccount;
    }

    public void setIdAccount(Account idAccount) {
        this.idAccount = idAccount;
    }
}
