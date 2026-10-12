package com.pro.pass.dto;

import java.time.LocalDate;

import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Data
public class PasswordDTO {
    private Long id;
    private String nomePassword;
    private String password;
    private String link;
    private String username;
    private String note;
    private LocalDate creazionePassword;
    private AccountDTO idAccount;
}
